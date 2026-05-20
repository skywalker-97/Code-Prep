import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { notify } from "../utils/notify";

function formatTime(seconds) {
  const value = Number(seconds) || 0;
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function Results() {
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    Promise.all([api.get("/results/my-results"), api.get("/results/leaderboard?limit=10")])
      .then(([resultsRes, leaderboardRes]) => {
        setResults(resultsRes.data || []);
        setLeaderboard(leaderboardRes.data || []);
      })
      .catch(() => notify("Failed to load results", "error"));
  }, [navigate]);

  return (
    <>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Your Results</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg mt-2 font-medium">Review your performance and track your growth.</p>
        </div>

        {results.length === 0 && (
          <div className="card bg-white dark:bg-slate-900 border-dashed border-2 border-slate-200 dark:border-slate-800 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-lg">No attempts yet. Ready to take your first test?</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((r, idx) => {
            const percentage = r.totalQuestions
              ? Math.round((r.score / r.totalQuestions) * 100)
              : 0;
            const isPass = percentage >= 40;

            return (
              <div 
                key={r._id} 
                className={`card relative overflow-hidden bg-white dark:bg-slate-900 border-none shadow-lg ring-1 ring-slate-200 dark:ring-slate-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-${idx * 100}`}
              >
                <div className={`absolute top-0 right-0 px-4 py-1 font-black text-xs tracking-widest ${isPass ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                  {isPass ? "PASSED" : "FAILED"}
                </div>
                
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Score</p>
                    <p className="text-5xl font-black text-slate-800 dark:text-white mt-1">
                      {r.score}<span className="text-2xl text-slate-400 font-medium">/{r.totalQuestions}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">Accuracy</p>
                    <p className={`text-3xl font-black mt-1 ${isPass ? "text-emerald-500" : "text-red-500"}`}>{percentage}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTime(r.timeTakenSeconds)}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {leaderboard.length > 0 && (
          <div className="card bg-white dark:bg-slate-900 border-none shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Leaderboard</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-4 pr-4">Rank</th>
                    <th className="pb-4 pr-4">Candidate</th>
                    <th className="pb-4 pr-4">Score</th>
                    <th className="pb-4 pr-4">Accuracy</th>
                    <th className="pb-4 pr-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.userId} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-5 pr-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? "bg-amber-400 text-white" : 
                          index === 1 ? "bg-slate-300 text-white" :
                          index === 2 ? "bg-amber-600 text-white" :
                          "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-5 pr-4">
                        <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{entry.name}</span>
                      </td>
                      <td className="py-5 pr-4 font-medium text-slate-600 dark:text-slate-400">
                        {entry.score}/{entry.totalQuestions}
                      </td>
                      <td className="py-5 pr-4 font-black text-slate-800 dark:text-slate-200">
                        {entry.percentage}%
                      </td>
                      <td className="py-5 pr-4 text-slate-500 font-mono">
                        {formatTime(entry.timeTakenSeconds)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
