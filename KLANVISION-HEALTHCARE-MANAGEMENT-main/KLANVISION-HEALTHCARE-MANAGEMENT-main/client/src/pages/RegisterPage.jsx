import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";

const initialForm = { name: "", email: "", password: "", phone: "", age: "", gender: "" };

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({ ...form, age: Number(form.age) });
      navigate("/dashboard");
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout eyebrow="GET STARTED" title="Care starts here." subtitle="Create your patient account. It only takes a minute.">
      <form className="form-stack register-form" onSubmit={submit}>
        <label>Full name<input required maxLength="100" value={form.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" placeholder="Your full name" /></label>
        <label>Email address<input type="email" required value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" placeholder="you@example.com" /></label>
        <div className="form-row">
          <label>Phone number<input inputMode="numeric" pattern="[0-9]{10}" minLength="10" maxLength="10" required value={form.phone} onChange={(event) => update("phone", event.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" /></label>
          <label>Age<input type="number" min="1" max="120" required value={form.age} onChange={(event) => update("age", event.target.value)} placeholder="Age" /></label>
        </div>
        <label>Gender<select required value={form.gender} onChange={(event) => update("gender", event.target.value)}><option value="">Select an option</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select></label>
        <label>Password<input type="password" minLength="8" required value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" placeholder="At least 8 characters" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary button-wide" disabled={busy}>{busy ? "Creating account..." : "Create patient account"} <span>→</span></button>
      </form>
      <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  );
}
