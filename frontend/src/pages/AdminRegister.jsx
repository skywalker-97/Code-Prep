import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { notify } from "../utils/notify";

export default function AdminRegister() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      notify("All fields are required", "error");
      return;
    }

    if (cleanPassword.length < 6) {
      notify("Password must be at least 6 characters", "error");
      return;
    }

    try {
      setLoading(true);
      try {
        await api.post("/auth/register", {
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          role: "admin"
        });
      } catch {
        await api.post("/register", {
          name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          role: "admin"
        });
      }

      notify("Admin account created successfully", "success");
      navigate("/admin-login");
    } catch (err) {
      notify(err.response?.data?.msg || err.response?.data?.message || "Admin registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-slate-100 dark:bg-slate-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 shadow border border-slate-200 dark:border-slate-800"
      >
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Register</h2>
        <p className="text-sm text-slate-500 mt-1">Create a new admin account.</p>

        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-4 border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 rounded-lg w-full"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-3 border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 rounded-lg w-full"
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
          {loading ? "Creating..." : "Create Admin"}
        </button>

        <p className="text-sm mt-4 text-slate-500">
          Already have admin account? <Link to="/admin-login" className="text-indigo-600">Login</Link>
        </p>
      </form>
    </div>
  );
}
