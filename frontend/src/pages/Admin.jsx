import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import { notify } from "../utils/notify";
import BulkUploadModal from "../components/BulkUploadModal";
import CodingProblemManager from "../components/CodingProblemManager";

function formatTime(seconds) {
  const value = Number(seconds) || 0;
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState("mcq"); // mcq or coding
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [savingTimer, setSavingTimer] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [audits, setAudits] = useState([]);

  const [question, setQuestion] = useState("");
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");
  const [opt4, setOpt4] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(300);

  const loadPage = async () => {
    try {
      const [statsRes, questionsRes, attemptsRes, auditsRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/exam/questions"),
        api.get("/admin/attempts?limit=20"),
        api.get("/admin/questions/audits").catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setTimerSeconds(statsRes.data?.timerSeconds || 300);
      setQuestions(questionsRes.data || []);
      setAttempts(attemptsRes.data || []);
      setAudits(auditsRes.data || []);
    } catch (err) {
      notify(err.response?.data?.message || "Failed to load admin data", "error");
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const leaderboard = useMemo(() => {
    const grouped = new Map();
    attempts.forEach((attempt) => {
      const key = String(attempt.userId);
      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, attempt);
        return;
      }
      const existingScore = existing.totalQuestions
        ? existing.score / existing.totalQuestions
        : 0;
      const currentScore = attempt.totalQuestions
        ? attempt.score / attempt.totalQuestions
        : 0;
      if (currentScore > existingScore) {
        grouped.set(key, attempt);
      } else if (currentScore === existingScore && attempt.timeTakenSeconds < existing.timeTakenSeconds) {
        grouped.set(key, attempt);
      }
    });

    return Array.from(grouped.values())
      .sort((a, b) => {
        const pa = a.totalQuestions ? a.score / a.totalQuestions : 0;
        const pb = b.totalQuestions ? b.score / b.totalQuestions : 0;
        if (pb !== pa) return pb - pa;
        if (b.score !== a.score) return b.score - a.score;
        return a.timeTakenSeconds - b.timeTakenSeconds;
      })
      .slice(0, 10);
  }, [attempts]);

  const addQuestion = async () => {
    if (!question.trim()) {
      notify("Question is required", "error");
      return;
    }

    const options = [opt1, opt2, opt3, opt4].map((o) => o.trim());
    if (options.some((o) => !o)) {
      notify("All 4 options are required", "error");
      return;
    }
    if (!options.includes(correctAnswer.trim())) {
      notify("Correct answer must match one of the options exactly", "error");
      return;
    }

    try {
      await api.post("/admin/questions", {
        question: question.trim(),
        options,
        correctAnswer: correctAnswer.trim()
      });
      notify("Question added", "success");
      setQuestion("");
      setOpt1("");
      setOpt2("");
      setOpt3("");
      setOpt4("");
      setCorrectAnswer("");
      loadPage();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to add question", "error");
    }
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      notify("Question deleted", "success");
      loadPage();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to delete question", "error");
    }
  };

  const saveTimer = async () => {
    const parsed = Number(timerSeconds);
    if (!Number.isFinite(parsed) || parsed < 30 || parsed > 7200) {
      notify("Timer must be between 30 and 7200 seconds", "error");
      return;
    }

    try {
      setSavingTimer(true);
      await api.put("/admin/settings", { timerSeconds: Math.floor(parsed) });
      const statsRes = await api.get("/admin/stats");
      setStats(statsRes.data);
      setTimerSeconds(statsRes.data?.timerSeconds || Math.floor(parsed));
      notify("Timer updated", "success");
    } catch (err) {
      notify(err.response?.data?.message || "Failed to update timer", "error");
    } finally {
      setSavingTimer(false);
    }
  };

  const undoUpload = async (batchId) => {
    if (!window.confirm("Are you sure you want to rollback this upload?")) return;
    try {
      await api.post(`/admin/questions/rollback/${batchId}`);
      notify("Rollback successful", "success");
      loadPage();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to rollback", "error");
    }
  };

  if (!stats) return null;

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Console</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium">Manage questions, students, and exam settings.</p>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800">
            <button 
              onClick={() => setActiveTab("mcq")}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "mcq" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              MCQ Questions
            </button>
            <button 
              onClick={() => setActiveTab("coding")}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === "coding" ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Coding Problems
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[
            { label: "MCQs", value: stats.questions, color: "text-slate-800 dark:text-white" },
            { label: "Students", value: stats.students, color: "text-emerald-600" },
            { label: "Attempts", value: stats.attempts, color: "text-emerald-600" },
            { label: "Avg Score", value: stats.averageScore, color: "text-amber-600" },
            { label: "Avg %", value: stats.averagePercentage + "%", color: "text-rose-600" }
          ].map((s, i) => (
            <div key={i} className="card bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-6">
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">{s.label}</p>
              <p className={`text-3xl font-black mt-2 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {activeTab === "mcq" ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="card bg-white dark:bg-slate-900 border-none shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Add MCQ Question</h3>
                <button 
                  className="px-6 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-black text-sm rounded-xl hover:bg-emerald-600 hover:text-white transition-all" 
                  onClick={() => setIsBulkUploadOpen(true)}
                >
                  Bulk Upload
                </button>
              </div>

              <div className="space-y-4">
                <input
                  className="input-field border p-4 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 w-full font-medium"
                  placeholder="Type your question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[setOpt1, setOpt2, setOpt3, setOpt4].map((setter, i) => (
                    <input
                      key={i}
                      className="input-field border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 w-full"
                      placeholder={`Option ${i + 1}`}
                      value={[opt1, opt2, opt3, opt4][i]}
                      onChange={(e) => setter(e.target.value)}
                    />
                  ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-4">
                  <select
                    className="input-field border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 flex-1 font-bold"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                  >
                    <option value="">Select Correct Answer</option>
                    {[opt1, opt2, opt3, opt4].filter(o => o.trim()).map((o, i) => (
                      <option key={i} value={o.trim()}>{o.trim()}</option>
                    ))}
                  </select>
                  <button className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all md:w-48" onClick={addQuestion}>
                    Add Question
                  </button>
                </div>
              </div>
            </div>

            <div className="card bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-8">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Exam Settings</h3>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Exam Timer (Seconds)</label>
                  <input
                    className="input-field border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 w-full font-mono text-lg"
                    type="number"
                    min={30}
                    max={7200}
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(e.target.value)}
                  />
                </div>
                <button className="px-8 py-3 bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-xl font-black hover:opacity-90 transition-all h-[52px]" onClick={saveTimer} disabled={savingTimer}>
                  {savingTimer ? "Saving..." : "Update Timer"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="card bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-8">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Upload History</h3>
                <div className="overflow-x-auto space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {audits.map((a) => (
                    <div key={a._id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(a.createdAt).toLocaleString()}</p>
                        <p className="font-bold text-slate-700 dark:text-slate-300 mt-1">
                          {a.successRows} Success / {a.failedRows} Fail
                        </p>
                      </div>
                      {a.status !== "RolledBack" && a.successRows > 0 && (
                        <button onClick={() => undoUpload(a.batchId)} className="text-red-500 font-bold text-xs hover:underline uppercase tracking-wider">Rollback</button>
                      )}
                    </div>
                  ))}
                  {audits.length === 0 && <p className="text-slate-500 italic">No bulk uploads yet.</p>}
                </div>
              </div>

              <div className="card bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-8">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Recent Attempts</h3>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {attempts.map((entry) => (
                    <div key={entry.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-800">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{entry.name}</p>
                          <p className="text-xs text-slate-500">{entry.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-emerald-600">{entry.score}/{entry.totalQuestions}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{formatTime(entry.timeTakenSeconds)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {attempts.length === 0 && <p className="text-slate-500 italic">No attempts yet.</p>}
                </div>
              </div>
            </div>

            <div className="card bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 p-8">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Question Bank ({questions.length})</h3>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {questions.map((q, i) => (
                  <div key={q._id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex justify-between items-start group">
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 dark:text-slate-200"><span className="text-emerald-500 mr-2">{i + 1}.</span> {q.question}</p>
                      <p className="text-sm text-emerald-600 font-bold mt-1">Ans: {q.correctAnswer}</p>
                    </div>
                    <button onClick={() => deleteQuestion(q._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CodingProblemManager />
          </div>
        )}
      </div>

      {isBulkUploadOpen && (
        <BulkUploadModal isOpen={isBulkUploadOpen} onClose={() => setIsBulkUploadOpen(false)} onUploadSuccess={loadPage} />
      )}
    </>
  );
}
