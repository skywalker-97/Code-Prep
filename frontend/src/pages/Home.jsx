import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getUserRole, isLoggedIn } from "../utils/auth";

export default function Home() {
  const loggedIn = isLoggedIn();
  const role = getUserRole();

  return (
    <>
      <Navbar />
      <div className="min-h-[calc(100vh-70px)] bg-gradient-to-b from-emerald-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="uppercase tracking-[0.25em] text-xs text-emerald-700 dark:text-emerald-300">MERN Coding Platform</p>
          <h1 className="text-5xl md:text-6xl font-black mt-3 text-slate-900 dark:text-white">Practice. Run. Improve.</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-5 max-w-2xl mx-auto">
            DSA problems, Monaco editor, code execution, submissions history, leaderboard and notes - sab ek hi jagah.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            {!loggedIn && (
              <>
                <Link to="/register" className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700">
                  Start Free
                </Link>
                <Link to="/login" className="px-5 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-100">
                  Login
                </Link>
              </>
            )}

            {loggedIn && role === "student" && (
              <Link to="/dashboard" className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700">
                Go to Dashboard
              </Link>
            )}

            {loggedIn && role === "admin" && (
              <Link to="/admin" className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700">
                Open Admin Panel
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
