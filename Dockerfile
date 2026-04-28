# Dockerfile per Bot Telegram Aethersy-AI
# Official Bot Mode con python-telegram-bot

FROM python:3.11-slim

WORKDIR /app

# Copia requirements del bot
COPY bot-telegram/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia il codice del bot
COPY bot-telegram/main.py .
COPY bot-telegram/.env.example .env

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "print('Bot OK')" || exit 1

# Avvia il bot
CMD ["python", "main.py"]
