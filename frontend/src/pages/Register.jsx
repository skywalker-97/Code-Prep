import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { notify } from "../utils/notify";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const register = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName || !cleanEmail || !cleanPassword) {
      notify("Please fill all fields", "error");
      return;
    }

    if (cleanName.length < 2) {
      notify("Name must be at least 2 characters", "error");
      return;
    }

    if (cleanPassword.length < 6) {
      notify("Password must be at least 6 characters", "error");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword
      };

      const calls = [
        () => api.post("/auth/register", payload),
        () => api.post("/register", payload),
        () =>
          api.post("https://code-prep-backend-t9wt.onrender.com/api/auth/register", payload)
      ];

      let lastError = null;
      for (let round = 0; round < 3; round += 1) {
        for (const call of calls) {
          try {
            await call();
            lastError = null;
            round = 3;
            break;
          } catch (err) {
            lastError = err;
          }
        }

        if (!lastError) {
          break;
        }

        const status = lastError.response?.status;
        const shouldRetry = !status || status >= 500;
        if (shouldRetry && round < 2) {
          await sleep(6000);
        }
      }

      if (lastError) {
        throw lastError;
      }
      navigate("/login");
    } catch (error) {
      const status = error.response?.status;
      const message =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        `Registration failed. API base: ${api.defaults.baseURL}${status ? ` (HTTP ${status})` : ""}`;
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-slate-100 dark:bg-slate-950">
      <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 shadow">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create Account</h2>

        <input
          className="mt-5 border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 rounded-lg w-full"
          placeholder="Name"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="mt-3 border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 rounded-lg w-full"
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
          onClick={register}
          disabled={loading}
          className="mt-4 bg-emerald-600 text-white w-full py-2.5 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-70"
        >
          {loading ? "Creating..." : "Signup"}
        </button>

        <p className="text-sm mt-4 text-slate-500">
          Already have an account? <Link to="/login" className="text-emerald-600">Login</Link>
        </p>
      </div>
    </div>
  );
}
