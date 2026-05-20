import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api";

export default function History() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get("/submissions/history")
      .then((res) => setHistory(res.data || []))
      .catch(() => setHistory([]));
  }, []);

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Submission History</h1>

        <div className="mt-6 card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Problem</th>
                <th className="py-2 pr-3">Difficulty</th>
                <th className="py-2 pr-3">Language</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item._id} className="border-b">
                  <td className="py-2 pr-3">{item.problemId?.title || "Deleted problem"}</td>
                  <td className="py-2 pr-3">{item.problemId?.difficulty || "-"}</td>
                  <td className="py-2 pr-3">{item.language}</td>
                  <td className="py-2 pr-3">{item.status}</td>
                  <td className="py-2 pr-3">{item.score}</td>
                  <td className="py-2 pr-3">{new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {history.length === 0 && <p className="text-slate-500">No submissions yet.</p>}
        </div>
      </div>
    </>
  );
}
