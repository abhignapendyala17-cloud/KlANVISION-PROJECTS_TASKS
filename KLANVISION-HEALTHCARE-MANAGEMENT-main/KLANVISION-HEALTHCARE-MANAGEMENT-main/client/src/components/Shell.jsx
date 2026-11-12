import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";

const navByRole = {
  patient: [
    ["Dashboard", "/dashboard"],
    ["Find a doctor", "/doctors"],
    ["My appointments", "/appointments"],
    ["History", "/history"],
  ],
  doctor: [
    ["Dashboard", "/dashboard"],
    ["My appointments", "/appointments"],
    ["History", "/history"],
  ],
  admin: [
    ["Dashboard", "/dashboard"],
    ["Doctors", "/admin/doctors"],
    ["Patients", "/admin/patients"],
    ["Appointments", "/appointments"],
    ["History", "/history"],
  ],
};

export default function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const notify = useToast();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      notify(errorMessage(error), "error");
    } finally {
      navigate("/login");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/dashboard" className="brand">
            <span className="brand-mark">+</span>
            <span>careflow<span className="brand-period">.</span></span>
          </NavLink>
          <nav className="main-nav" aria-label="Main navigation">
            {(navByRole[user.role] || []).map(([label, path]) => (
              <NavLink key={path} to={path} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="user-menu">
            <div className="user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
            <div className="user-meta">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
            <button className="button button-quiet button-small" onClick={handleLogout}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="main-content"><Outlet /></main>
      <footer className="footer">Careflow <span>·</span> Your health, thoughtfully managed</footer>
    </div>
  );
}
