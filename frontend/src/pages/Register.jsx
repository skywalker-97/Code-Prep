import { useState } from "react";
import api from "../api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    await api.post("/auth/register", { name, email, password });
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 border w-80">
        <h2 className="text-xl font-bold mb-4">Register</h2>

        <input className="border p-2 w-full mb-3" placeholder="Name"
          onChange={e => setName(e.target.value)} />
        <input className="border p-2 w-full mb-3" placeholder="Email"
          onChange={e => setEmail(e.target.value)} />
        <input type="password" className="border p-2 w-full mb-3"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)} />

        <button onClick={register}
          className="bg-green-600 text-white w-full py-2">
          Register
        </button>
      </div>
    </div>
  );
}
