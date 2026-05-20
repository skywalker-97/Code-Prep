import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { notify } from "../utils/notify";

export default function Exam() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [examDuration, setExamDuration] = useState(300);
  const [timeLeft, setTimeLeft] = useState(300);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const loadExam = async () => {
      try {
        const [statusRes, configRes, questionsRes] = await Promise.all([
          api.get("/exam/status"),
          api.get("/exam/config"),
          api.get("/exam/questions")
        ]);

        if (statusRes.data.submitted) {
          navigate("/results", { replace: true });
          return;
        }

        const timer = Number(configRes.data?.timerSeconds) || 300;
        setExamDuration(timer);
        setTimeLeft(timer);
        setQuestions(questionsRes.data || []);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/", { replace: true });
        } else {
          notify("Failed to load exam", "error");
        }
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [navigate]);

  const handleSelect = (qid, opt) => {
    setAnswers((prev) => ({ ...prev, [qid]: opt }));
  };

  const submitExam = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);

    const timeTakenSeconds = Math.max(0, examDuration - timeLeft);
    try {
      await api.post("/exam/submit", { answers, timeTakenSeconds });
      navigate("/results", { replace: true });
    } catch (err) {
      if (err.response?.status === 409) {
        navigate("/results", { replace: true });
        return;
      }
      notify(err.response?.data?.message || "Submit failed", "error");
      setSubmitted(false);
    }
  }, [submitted, examDuration, timeLeft, navigate, answers]);

  useEffect(() => {
    if (submitted || loading) return;
    if (timeLeft <= 0) {
      submitExam();
      return;
    }
    const timerId = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft, submitted, loading, submitExam]);

  useEffect(() => {
    if (submitted) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [submitted]);

  const q = questions[current];
  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round((Object.keys(answers).length / questions.length) * 100);
  }, [answers, questions.length]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-3xl mx-auto mt-10 card">Loading exam...</div>
      </>
    );
  }

  if (!questions.length) {
    return (
      <>
        <Navbar />
        <div className="max-w-3xl mx-auto mt-10 card">
          No questions available right now. Please contact admin.
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="card shadow-xl border-t-4 border-indigo-500">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium text-slate-500">
                Question {current + 1} of {questions.length}
              </span>
            </div>
            <div className={`flex items-center gap-2 font-mono text-lg ${timeLeft < 60 ? "text-red-500 animate-pulse" : "text-emerald-500"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span>Exam Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>

          {q && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-8 leading-tight">
                {q.question}
              </h2>
              
              <div className="space-y-4">
                {q.options.map((opt, idx) => {
                  const isSelected = answers[q._id] === opt;
                  return (
                    <label
                      key={idx}
                      className={`group flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-500" 
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                      }`}
                    >
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${
                        isSelected ? "border-indigo-500 bg-indigo-500" : "border-slate-300 dark:border-slate-600"
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <input
                        type="radio"
                        name={q._id}
                        value={opt}
                        checked={isSelected}
                        onChange={(e) => handleSelect(q._id, e.target.value)}
                        className="hidden"
                      />
                      <span className={`text-lg ${isSelected ? "text-indigo-900 dark:text-indigo-100 font-medium" : "text-slate-700 dark:text-slate-300"}`}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-12 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition"
              disabled={current === 0 || submitted}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setCurrent((c) => c - 1);
              }}
            >
              Previous
            </button>

            {current === questions.length - 1 ? (
              <button 
                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 disabled:opacity-50 transition transform hover:scale-105 active:scale-95" 
                disabled={submitted} 
                onClick={submitExam}
              >
                {submitted ? "Submitting..." : "Submit Exam"}
              </button>
            ) : (
              <button
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition transform hover:scale-105 active:scale-95"
                disabled={submitted}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setCurrent((c) => c + 1);
                }}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
