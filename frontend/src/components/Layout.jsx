import { Link, NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-sage text-white" : "text-slate-700 hover:bg-cream"}`;

export default function Layout({ children }) {
  const { isAuthenticated, email, logout } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <header className="border-b border-sage/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link to="/" className="text-lg font-bold text-sage">
            Prenatal Yoga AI
          </Link>
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/" className={linkClass} end>
              Home
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/onboarding" className={linkClass}>
                  Onboarding
                </NavLink>
                <NavLink to="/dashboard" className={linkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/session" className={linkClass}>
                  Session
                </NavLink>
                <NavLink to="/chat" className={linkClass}>
                  Chat
                </NavLink>
                <NavLink to="/profile" className={linkClass}>
                  Profile
                </NavLink>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-sage hover:bg-cream"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-sage px-3 py-2 text-sm font-semibold text-white"
                >
                  Sign up
                </Link>
              </>
            )}
            {isAuthenticated && (
              <div className="flex items-center gap-2 pl-2">
                <span className="hidden max-w-[140px] truncate text-xs text-slate-500 sm:inline" title={email}>
                  {email}
                </span>
                <button
                  type="button"
                  className="rounded-lg border border-sage/30 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-cream"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
