import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Research from "./pages/Research";
import BusinessPlan from "./pages/BusinessPlan";
import Chat from "./pages/Chat";
import Knowledge from "./pages/Knowledge";
import Marketplace from "./pages/Marketplace";
import Copilot from "./pages/Copilot";
import Code from "./pages/Code";
import CRM from "./pages/CRM";
import Finance from "./pages/Finance";
import Email from "./pages/Email";
import Funnels from "./pages/Funnels";
import Telegram from "./pages/Telegram";
import AuthCallback from "./pages/AuthCallback";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import PaymentReturn from "./pages/PaymentReturn";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] text-zinc-500">
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster theme="dark" position="top-right" toastOptions={{
          style: { background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)", color: "white" }
        }}/>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/pricing" element={<Protected><Pricing /></Protected>} />
          <Route path="/billing/return" element={<Protected><PaymentReturn /></Protected>} />
          <Route element={<Protected><Layout /></Protected>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/research" element={<Research />} />
            <Route path="/business-plan" element={<BusinessPlan />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/copilot" element={<Copilot />} />
            <Route path="/code" element={<Code />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/email" element={<Email />} />
            <Route path="/funnels" element={<Funnels />} />
            <Route path="/telegram" element={<Telegram />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
