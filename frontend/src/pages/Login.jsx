import { useState } from "react";
import api from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password: password.trim()
      };

      let res;
      try {
        res = await api.post("/login", payload);
      } catch (err) {
        res = await api.post("/auth/login", payload);
      }

      localStorage.setItem("token", res.data.token);
      window.location.href = "/exam";

    } catch (err) {
      console.log("Login Error:", err.response?.data);
      alert(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 border w-80">
        <h2 className="text-xl font-bold mb-4">Login</h2>

        <input
          className="border p-2 w-full mb-3"
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border p-2 w-full mb-3"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="bg-blue-600 text-white w-full py-2"
        >
          Login
        </button>

        <p className="text-sm mt-2">
          New user?{" "}
          <a href="/register" className="text-blue-600">
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
