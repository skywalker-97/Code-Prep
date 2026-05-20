import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";

export default function Contests() {
  const [contests, setContests] = useState([]);

  useEffect(() => {
    api.get("/contests")
      .then((res) => setContests(res.data || []))
      .catch(() => setContests([]));
  }, []);

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Contest Mode</h1>
        <p className="text-slate-500 mt-1">Timer-based ranked practice contests.</p>

        <div className="mt-6 space-y-3">
          {contests.map((contest) => (
            <Link key={contest._id} to={`/contests/${contest._id}`} className="block card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">{contest.title}</h2>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  contest.status === "live"
                    ? "bg-emerald-100 text-emerald-700"
                    : contest.status === "upcoming"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-200 text-slate-700"
                }`}>
                  {contest.status.toUpperCase()}
                </span>
              </div>
              <p className="text-slate-500 mt-2">{contest.description}</p>
              <p className="text-sm mt-2">Problems: {contest.problemCount}</p>
              <p className="text-sm text-slate-500 mt-1">{new Date(contest.startTime).toLocaleString()} - {new Date(contest.endTime).toLocaleString()}</p>
            </Link>
          ))}
          {contests.length === 0 && <div className="card">No contests available.</div>}
        </div>
      </div>
    </>
  );
}
