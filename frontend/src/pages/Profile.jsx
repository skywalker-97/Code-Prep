import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="max-w-3xl mx-auto p-6">Unable to load profile.</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="card">
          <h2 className="text-2xl font-bold">My Profile</h2>
          <div className="mt-4 space-y-2">
            <p><b>Name:</b> {user.name}</p>
            <p><b>Email:</b> {user.email}</p>
            <p><b>Role:</b> {user.role}</p>
          </div>
        </div>
      </div>
    </>
  );
}
