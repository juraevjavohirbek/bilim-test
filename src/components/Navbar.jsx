import { Link, NavLink } from "react-router-dom";
import logo from "../assets/logo.svg";
import { useState } from "react";
import { useApp } from "../hooks/useApp";

function Navbar() {
  const { user, logout } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setBusy(true);
    setError("");
    try { await logout(); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return (
    <header className="navbar">
      <nav className="navbar-container container" aria-label="Asosiy menyu">
        <Link to="/" className="logo">
          <img src={logo} alt="" width="36" height="36" />
          <span>BilimTest</span>
        </Link>

        <div className="navbar-list">
          <ul className="navbar-items">
            <li className="navbar-item">
              <NavLink to="/" end>Bosh sahifa</NavLink>
            </li>

            <li className="navbar-item">
              <NavLink to="/subjects">Fanlar va savollar</NavLink>
            </li>
            <li className="navbar-item">
              <NavLink to="/matching">Bog‘lash</NavLink>
            </li>
            <li className="navbar-item">
              <NavLink to="/crosswords">Krasvord</NavLink>
            </li>
          </ul>
        </div>

        <div className="login">
          {user ? (
            <>
              <span className="teacher-name">{user.name}</span>
              <button type="button" onClick={handleLogout} disabled={busy}>
                {busy ? "Chiqilmoqda..." : "Chiqish"}
              </button>
            </>
          ) : <Link to="/login">Kirish</Link>}
        </div>
      </nav>
      {error && <p className="form-error container" role="alert">{error}</p>}
    </header>
  );
}

export default Navbar;
