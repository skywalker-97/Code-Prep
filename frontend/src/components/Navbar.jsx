import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getUserRole, isLoggedIn } from "../utils/auth";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const role = getUserRole();

  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `block px-4 py-3 rounded-xl text-base font-bold transition-all duration-200 ${
      isActive
        ? "bg-indigo-600 text-white"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  const onLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl">C</div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Code<span className="text-indigo-600">Prep</span>
            </span>
          </NavLink>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {!loggedIn && (
              <>
                <NavLink to="/login" className={linkClass}>Login</NavLink>
                <NavLink to="/register" className={linkClass}>Signup</NavLink>
                <NavLink to="/admin-login" className={linkClass}>Admin</NavLink>
              </>
            )}

            {loggedIn && role === "student" && (
              <>
                <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
                <NavLink to="/problems" className={linkClass}>Problems</NavLink>
                <NavLink to="/exam" className={linkClass}>MCQ Test</NavLink>
                <NavLink to="/leaderboard" className={linkClass}>Leaderboard</NavLink>
                <NavLink to="/daily-challenge" className={linkClass}>Daily</NavLink>
                <NavLink to="/history" className={linkClass}>History</NavLink>
                <button onClick={onLogout} className="ml-2 px-4 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                  Logout
                </button>
              </>
            )}

            {loggedIn && role === "admin" && (
              <>
                <NavLink to="/admin" className={linkClass}>Admin Panel</NavLink>
                <button onClick={onLogout} className="ml-2 px-4 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                  Logout
                </button>
              </>
            )}
            
            <div className="ml-4 pl-4 border-l border-slate-200 dark:border-slate-800">
              <ThemeToggle />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 space-y-2 animate-in slide-in-from-top-4 duration-300">
          {!loggedIn && (
            <>
              <NavLink to="/login" onClick={() => setIsOpen(false)} className={mobileLinkClass}>Login</NavLink>
              <NavLink to="/register" onClick={() => setIsOpen(false)} className={mobileLinkClass}>Signup</NavLink>
              <NavLink to="/admin-login" onClick={() => setIsOpen(false)} className={mobileLinkClass}>Admin</NavLink>
            </>
          )}

          {loggedIn && role === "student" && (
            <>
              <NavLink to="/dashboard" onClick={() => setIsOpen(false)} className={mobileLinkClass}>Dashboard</NavLink>
              <NavLink to="/problems" onClick={() => setIsOpen(false)} className={mobileLinkClass}>Problems</NavLink>
              <NavLink to="/exam" onClick={() => setIsOpen(false)} className={mobileLinkClass}>MCQ Test</NavLink>
              <NavLink to="/leaderboard" onClick={() => setIsOpen(false)} className={mobileLinkClass}>Leaderboard</NavLink>
              <NavLink to="/daily-challenge" onClick={() => setIsOpen(false)} className={mobileLinkClass}>Daily Challenge</NavLink>
              <NavLink to="/history" onClick={() => setIsOpen(false)} className={mobileLinkClass}>My History</NavLink>
              <button 
                onClick={() => { onLogout(); setIsOpen(false); }} 
                className="w-full text-left px-4 py-3 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Logout
              </button>
            </>
          )}

          {loggedIn && role === "admin" && (
            <>
              <NavLink to="/admin" onClick={() => setIsOpen(false)} className={mobileLinkClass}>Admin Panel</NavLink>
              <button 
                onClick={() => { onLogout(); setIsOpen(false); }} 
                className="w-full text-left px-4 py-3 rounded-xl text-base font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
