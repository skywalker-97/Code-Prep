import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";
import { notify } from "../utils/notify";

export default function DailyChallenge() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/daily/today");
      setData(res.data);
    } catch (err) {
      notify(err.response?.data?.message || "Failed to load daily challenge", "error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markSolved = async () => {
    try {
      setLoading(true);
      await api.post("/daily/mark-solved");
      await load();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to mark solved", "error");
    } finally {
      setLoading(false);
    }
  };

  const challenge = data?.challenge;

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Daily Challenge</h1>
        <p className="text-slate-500 mt-1">Solve one problem every day and build streak.</p>

        <div className="grid sm:grid-cols-2 gap-4 mt-6">
          <div className="card">
            <p className="text-slate-500">Current Streak</p>
            <p className="text-4xl font-black text-emerald-600 mt-1">{data?.streak ?? 0}</p>
          </div>
          <div className="card">
            <p className="text-slate-500">Longest Streak</p>
            <p className="text-4xl font-black text-indigo-600 mt-1">{data?.longestStreak ?? 0}</p>
          </div>
        </div>

        <div className="card mt-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Today</p>
          {!challenge && <p className="mt-3">No challenge set yet.</p>}

          {challenge && (
            <>
              <h2 className="text-xl font-bold mt-2">{challenge.problemId?.title}</h2>
              <p className="text-slate-500 mt-1">Difficulty: {challenge.problemId?.difficulty}</p>
              <div className="mt-3 flex gap-2 flex-wrap">
                {(challenge.problemId?.tags || []).map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs">#{tag}</span>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Link to={`/problems/${challenge.problemId?._id}`} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">
                  Solve Now
                </Link>
                <button
                  onClick={markSolved}
                  disabled={loading || data?.solvedToday}
                  className="px-4 py-2 rounded-lg border disabled:opacity-60"
                >
                  {data?.solvedToday ? "Already Completed" : loading ? "Updating..." : "Mark as Solved"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
