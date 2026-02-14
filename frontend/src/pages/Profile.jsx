import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/auth/me", {
      headers: { Authorization: localStorage.getItem("token") }
    }).then(res => setUser(res.data));
  }, []);

  if (!user) return null;

  return (
    <>
      <Navbar />
      <div className="max-w-md mx-auto p-6">
        <h2 className="text-xl font-bold mb-4">My Profile</h2>
        <p>Name: {user.name}</p>
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
      </div>
    </>
  );
}
