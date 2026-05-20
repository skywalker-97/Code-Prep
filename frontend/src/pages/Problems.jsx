import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";

export default function Problems() {
  const [problems, setProblems] = useState([]);
  const [difficulty, setDifficulty] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (difficulty) params.set("difficulty", difficulty);
    if (tag) params.set("tag", tag);

    api.get(`/problems?${params.toString()}`)
      .then((res) => setProblems(res.data || []))
      .catch(() => setProblems([]));
  }, [difficulty, tag]);

  const tags = useMemo(() => {
    const set = new Set();
    problems.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [problems]);

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Problem Bank</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Master your coding skills with curated challenges.</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Difficulty</label>
              <select 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Topic</label>
              <select 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                value={tag} 
                onChange={(e) => setTag(e.target.value)}
              >
                <option value="">All Topics</option>
                {tags.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {problems.length === 0 && (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 font-bold italic">No problems found matching your criteria.</p>
            </div>
          )}

          {problems.map((p) => (
            <Link
              key={p._id}
              to={`/problems/${p._id}`}
              className="group block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-emerald-500 transition-all shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transform hover:-translate-y-1"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">{p.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      p.difficulty === "Easy" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" :
                      p.difficulty === "Medium" ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" :
                      "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                    }`}>
                      {p.difficulty}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(p.tags || []).map((t) => (
                      <span key={t} className="text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-bold uppercase tracking-wider">#{t}</span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Solve Problem
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
