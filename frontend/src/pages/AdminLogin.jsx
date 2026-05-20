import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { notify } from "../utils/notify";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@codeprep.com");
  const [password, setPassword] = useState("Admin@123");
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      notify("Email and password are required", "error");
      return;
    }

    try {
      setLoading(true);
      let res;
      try {
        res = await api.post("/auth/login", { email: cleanEmail, password: cleanPassword });
      } catch {
        res = await api.post("/login", { email: cleanEmail, password: cleanPassword });
      }

      if (res.data.role !== "admin") {
        notify("This account is not an admin account", "error");
        return;
      }

      localStorage.setItem("token", res.data.token);
      navigate("/admin");
    } catch (err) {
      notify(err.response?.data?.msg || err.response?.data?.message || "Admin login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-slate-100 dark:bg-slate-950">
      <form
        onSubmit={handleAdminLogin}
        className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 shadow border border-slate-200 dark:border-slate-800"
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Login</h2>
        <p className="text-sm text-slate-500 mt-1">Login with admin email and password.</p>

        <input
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-4 border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 rounded-lg w-full"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-3 border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 rounded-lg w-full"
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-indigo-600 text-white w-full py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-70"
        >
          {loading ? "Logging in..." : "Login as Admin"}
        </button>

        <p className="text-sm mt-4 text-slate-500">
          No admin account yet? <Link to="/admin-register" className="text-indigo-600">Create one</Link>
        </p>
      </form>
    </div>
  );
}
