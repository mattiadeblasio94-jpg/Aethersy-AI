"""JWT email/password auth for AI Entrepreneurship 360."""
import os
import uuid
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
JWT_EXP_DAYS = 7

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=80)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: str
    name: str


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXP_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def decode_token(token: str) -> str:
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return data["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# Dependency factory bound to db at app startup
def make_get_current_user(db: AsyncIOMotorDatabase):
    async def get_current_user(authorization: str = Header(default="")) -> dict:
        if not authorization.lower().startswith("bearer "):
            raise HTTPException(status_code=401, detail="Missing bearer token")
        token = authorization.split(" ", 1)[1]
        user_id = decode_token(token)
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    return get_current_user


def register_auth_routes(db: AsyncIOMotorDatabase):
    @auth_router.post("/register", response_model=AuthResponse)
    async def register(payload: RegisterRequest):
        existing = await db.users.find_one({"email": payload.email.lower()})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        user_id = str(uuid.uuid4())
        doc = {
            "id": user_id,
            "email": payload.email.lower(),
            "name": payload.name,
            "password": hash_password(payload.password),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(doc)
        token = make_token(user_id)
        return AuthResponse(
            token=token,
            user=UserPublic(id=user_id, email=doc["email"], name=doc["name"]),
        )

    @auth_router.post("/login", response_model=AuthResponse)
    async def login(payload: LoginRequest):
        user = await db.users.find_one({"email": payload.email.lower()})
        if not user or not verify_password(payload.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = make_token(user["id"])
        return AuthResponse(
            token=token,
            user=UserPublic(id=user["id"], email=user["email"], name=user["name"]),
        )

    class GoogleCallbackReq(BaseModel):
        session_id: str

    @auth_router.post("/google/callback", response_model=AuthResponse)
    async def google_callback(payload: GoogleCallbackReq):
        # Bridge: exchange Emergent session_id for user info, then issue OUR JWT
        import httpx as _httpx
        try:
            async with _httpx.AsyncClient(timeout=15) as c:
                r = await c.get(
                    "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                    headers={"X-Session-ID": payload.session_id},
                )
            if r.status_code != 200:
                raise HTTPException(401, "Invalid Google session")
            data = r.json()
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(502, f"Emergent auth error: {exc}")
        email = (data.get("email") or "").lower()
        name = data.get("name") or "Google User"
        if not email:
            raise HTTPException(400, "No email from Google")
        existing = await db.users.find_one({"email": email}, {"_id": 0})
        if existing:
            user_id = existing["id"]
            await db.users.update_one(
                {"id": user_id},
                {"$set": {"name": name, "google_picture": data.get("picture", "")}},
            )
        else:
            user_id = str(uuid.uuid4())
            await db.users.insert_one({
                "id": user_id,
                "email": email,
                "name": name,
                "password": "",  # No password for Google users
                "google_picture": data.get("picture", ""),
                "auth_provider": "google",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        token = make_token(user_id)
        return AuthResponse(
            token=token,
            user=UserPublic(id=user_id, email=email, name=name),
        )

    get_current_user = make_get_current_user(db)

    @auth_router.get("/me", response_model=UserPublic)
    async def me(user: dict = Depends(get_current_user)):
        return UserPublic(id=user["id"], email=user["email"], name=user["name"])

    return auth_router, get_current_user
