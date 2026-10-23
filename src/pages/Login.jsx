import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import logo from "../assets/logo.svg";

function Login() {
  const { user, authLoading, login } = useApp();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await login(form.get("email"), form.get("password"));
      navigate("/subjects", { replace: true });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (authLoading) return <p className="subject-section container" role="status">Yuklanmoqda...</p>;
  if (user) return <Navigate to="/subjects" replace />;
  return (
    <section className="login-page container">
      <div className="auth-card">
        <img src={logo} className="auth-logo" alt="" />
        <h1>O‘qituvchi kirishi</h1>
        <p>Hisobingizga kirib, mavzu va savollarni boshqaring.</p>
        <form onSubmit={handleSubmit} className="form-fields">
          <label>Email
            <input name="email" type="email" autoComplete="username" placeholder="email@example.com" required maxLength={254} disabled={busy} />
          </label>
          <label>Parol
            <input name="password" type="password" autoComplete="current-password" placeholder="Parolingizni kiriting" required maxLength={256} disabled={busy} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button" disabled={busy}>{busy ? "Tekshirilmoqda..." : "Kirish"}</button>
        </form>
      </div>
    </section>
  );
}

export default Login;
