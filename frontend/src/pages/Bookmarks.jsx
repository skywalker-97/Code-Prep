import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";

export default function Bookmarks() {
  const [problems, setProblems] = useState([]);

  useEffect(() => {
    api.get("/problems/bookmarks/my")
      .then((res) => setProblems(res.data || []))
      .catch(() => setProblems([]));
  }, []);

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bookmarked Problems</h1>
        <div className="mt-6 space-y-3">
          {problems.map((p) => (
            <Link key={p._id} to={`/problems/${p._id}`} className="block card">
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm text-slate-500 mt-1">{p.difficulty} • {(p.tags || []).join(", ")}</p>
            </Link>
          ))}
          {problems.length === 0 && <div className="card">No bookmarks yet.</div>}
        </div>
      </div>
    </>
  );
}
