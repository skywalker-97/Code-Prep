import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { notify } from "../utils/notify";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);
      const payload = {
        email: email.trim().toLowerCase(),
        password: password.trim()
      };

      const res = await api.post("/auth/login", payload);
      localStorage.setItem("token", res.data.token);

      if (res.data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      notify(err.response?.data?.msg || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-slate-100 dark:bg-slate-950">
      <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 shadow">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Login</h2>
        <p className="text-sm text-slate-500 mt-1">Continue your coding journey.</p>

        <input
          className="mt-5 border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 rounded-lg w-full"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="mt-3 border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 rounded-lg w-full"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          disabled={loading}
          className="mt-4 bg-emerald-600 text-white w-full py-2.5 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-70"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm mt-4 text-slate-500">
          New user? <Link to="/register" className="text-emerald-600">Create account</Link>
        </p>
      </div>
    </div>
  );
}
