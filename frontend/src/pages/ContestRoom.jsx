import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";

export default function ContestRoom() {
  const { id } = useParams();
  const [contest, setContest] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");

  const loadContest = useCallback(async () => {
    const [contestRes, leaderboardRes] = await Promise.all([
      api.get(`/contests/${id}`),
      api.get(`/contests/${id}/leaderboard`)
    ]);

    const contestData = contestRes.data;
    setContest(contestData);
    setLeaderboard(leaderboardRes.data || []);
    if (contestData.problemIds?.length && !selectedProblem) {
      setSelectedProblem(contestData.problemIds[0]._id);
    }
  }, [id, selectedProblem]);

  useEffect(() => {
    loadContest().catch(() => setContest(null));
  }, [loadContest]);

  const timeLeft = useMemo(() => {
    if (!contest) return "--";
    const now = new Date(contest.serverTime || Date.now());
    const end = new Date(contest.endTime);
    const diff = Math.max(0, Math.floor((end - now) / 1000));
    const min = Math.floor(diff / 60);
    const sec = diff % 60;
    return `${min}:${String(sec).padStart(2, "0")}`;
  }, [contest]);

  const submit = async () => {
    try {
      const res = await api.post(`/contests/${id}/submit`, {
        problemId: selectedProblem,
        code,
        language
      });
      setStatusMsg(`Submitted: ${res.data.status}, score ${res.data.score}`);
      await loadContest();
    } catch (err) {
      setStatusMsg(err.response?.data?.message || "Submit failed");
    }
  };

  if (!contest) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">Loading contest...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 card">
          <h1 className="text-2xl font-bold">{contest.title}</h1>
          <p className="text-slate-500 mt-1">Status: {contest.status} - Time Left: {timeLeft}</p>

          <div className="mt-4">
            <label className="text-sm">Problem</label>
            <select className="w-full border rounded-lg p-2 mt-1 bg-transparent" value={selectedProblem} onChange={(e) => setSelectedProblem(e.target.value)}>
              {contest.problemIds?.map((p) => (
                <option key={p._id} value={p._id}>{p.title} ({p.difficulty})</option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            <label className="text-sm">Language</label>
            <select className="w-full border rounded-lg p-2 mt-1 bg-transparent" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full mt-3 border rounded-lg p-3 bg-transparent font-mono text-sm"
            rows={14}
            placeholder="Write contest solution"
          />

          <div className="mt-3 flex items-center gap-3">
            <button onClick={submit} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">Submit</button>
            <p className="text-sm text-slate-500">{statusMsg}</p>
          </div>
        </section>

        <section className="card h-fit">
          <h2 className="font-semibold">Live Leaderboard</h2>
          <div className="mt-3 space-y-2">
            {leaderboard.map((row, idx) => (
              <div key={row.userId} className="flex justify-between text-sm border-b pb-2">
                <span>{idx + 1}. {row.name}</span>
                <span>{row.totalScore} pts</span>
              </div>
            ))}
            {leaderboard.length === 0 && <p className="text-slate-500 text-sm">No accepted submissions yet.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
