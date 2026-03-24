import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { register } from "../api/client";
import { useApp } from "../context/AppContext";

export default function Register() {
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const data = await register({
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
      });
      setAuth(data.access_token, data.user);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      const d = err?.response?.data?.detail;
      setError(typeof d === "string" ? d : "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-sage/15 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-bold text-sage">Create account</h1>
        <p className="mt-2 text-center text-sm text-slate-600">Start your safe prenatal yoga journey</p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Full name (optional)
            <input
              type="text"
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-sage/20 px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-xl border border-sage/20 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password (min 8 characters)
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="mt-1 w-full rounded-xl border border-sage/20 px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-sage py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Creating account…" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-sage underline">
            Log in
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link to="/" className="text-sm text-slate-500 underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
