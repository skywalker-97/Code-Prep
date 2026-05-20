import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api";

export default function Leaderboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get("/submissions/leaderboard")
      .then((res) => setRows(res.data || []))
      .catch(() => setRows([]));
  }, []);

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Leaderboard</h1>
        <p className="text-slate-500 mt-1">Scoring: Easy 10, Medium 20, Hard 30.</p>

        <div className="card mt-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Rank</th>
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">Accepted</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Last Accepted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.userId} className="border-b">
                  <td className="py-2 pr-3 font-bold">#{idx + 1}</td>
                  <td className="py-2 pr-3">{r.name}</td>
                  <td className="py-2 pr-3">{r.acceptedCount}</td>
                  <td className="py-2 pr-3">{r.totalScore}</td>
                  <td className="py-2 pr-3">{new Date(r.lastAcceptedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="text-slate-500">No accepted submissions yet.</p>}
        </div>
      </div>
    </>
  );
}
