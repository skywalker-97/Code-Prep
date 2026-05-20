import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/submissions/stats")
      .then((res) => setStats(res.data))
      .catch(() => setStats({ totalSubmissions: 0, acceptedSubmissions: 0, solvedProblems: 0, totalScore: 0 }));
  }, []);

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Welcome back! Track your progress and reach your goals.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="card bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Total Submissions</p>
            <p className="text-4xl font-black mt-2 text-slate-800 dark:text-slate-100">{stats?.totalSubmissions ?? "0"}</p>
          </div>
          <div className="card bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 border-l-4 border-emerald-500">
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Accepted</p>
            <p className="text-4xl font-black mt-2 text-emerald-600">{stats?.acceptedSubmissions ?? "0"}</p>
          </div>
          <div className="card bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 border-l-4 border-emerald-500">
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Solved Problems</p>
            <p className="text-4xl font-black mt-2 text-emerald-600">{stats?.solvedProblems ?? "0"}</p>
          </div>
          <div className="card bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 border-l-4 border-orange-500">
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Total Score</p>
            <p className="text-4xl font-black mt-2 text-orange-500">{stats?.totalScore ?? "0"}</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Explore Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/problems" className="group card bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 hover:ring-emerald-500 transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="font-bold text-xl text-slate-800 dark:text-white">Coding Problems</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Practice DSA and system design questions.</p>
          </Link>

          <Link to="/exam" className="group card bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 hover:ring-emerald-500 transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="font-bold text-xl text-emerald-600">MCQ Test</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Test your knowledge with multiple choice questions.</p>
          </Link>

          <Link to="/history" className="group card bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 hover:ring-slate-500 transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl text-slate-800 dark:text-white">History</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Review your past attempts and performance.</p>
          </Link>

          <Link to="/notes" className="group card bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6 hover:ring-amber-500 transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="font-bold text-xl text-slate-800 dark:text-white">Your Notes</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Access your saved study materials.</p>
          </Link>
        </div>
      </div>
    </>
  );
}
