import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function Exam() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  // ================= CHECK AUTH =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // ================= LOAD QUESTIONS =================
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const res = await api.get("/exam/questions");
        setQuestions(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/", { replace: true });
        } else {
          alert("Failed to load questions");
        }
      }
    };

    loadQuestions();
  }, [navigate]);

  // ================= CHECK SUBMISSION STATUS =================
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await api.get("/exam/status");
        if (res.data.submitted) {
          navigate("/results", { replace: true });
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/", { replace: true });
        }
      }
    };

    checkStatus();
  }, [navigate]);

  // ================= SAFE ANSWER UPDATE =================
  const handleSelect = (qid, opt) => {
    setAnswers(prev => ({
      ...prev,
      [qid]: opt,
    }));
  };

  // ================= SUBMIT EXAM =================
  const submitExam = async () => {
    if (submitted) return;

    setSubmitted(true);

    try {
      await api.post("/exam/submit", { answers });
      navigate("/results", { replace: true });
    } catch (err) {
      alert("Submit failed");
      setSubmitted(false);
    }
  };

  // ================= TIMER =================
  useEffect(() => {
    if (submitted) return;

    if (timeLeft <= 0) {
      submitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  // ================= PREVENT REFRESH =================
  useEffect(() => {
    if (submitted) return;

    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [submitted]);

  // ================= PREVENT BACK BUTTON =================
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = () => {
      window.history.go(1);
    };

    return () => {
      window.onpopstate = null;
    };
  }, []);

  const q = questions[current];

  return (
    <>
      <Navbar />

      <div className="max-w-3xl mx-auto mt-10 card">
        {/* Header */}
        <div className="flex justify-between mb-4 text-sm text-gray-500">
          <span>
            Question {current + 1} / {questions.length}
          </span>

          <span
            className={
              timeLeft < 60
                ? "text-red-600 font-semibold"
                : "text-green-600"
            }
          >
            ⏱ {Math.floor(timeLeft / 60)}:
            {String(timeLeft % 60).padStart(2, "0")}
          </span>
        </div>

        {/* Question */}
        {q && (
          <>
            <h2 className="text-lg font-semibold mb-4">
              {q.question}
            </h2>

            <div className="space-y-3">
              {q.options.map((opt) => (
                <label
                  key={opt}
                  className={`block p-3 border rounded cursor-pointer ${
                    answers[q._id] === opt
                      ? "bg-blue-100 border-blue-500"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={q._id}
                    value={opt}
                    checked={answers[q._id] === opt}
                    onChange={(e) =>
                      handleSelect(q._id, e.target.value)
                    }
                    className="mr-2"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </>
        )}

        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <button
            className="btn btn-secondary"
            disabled={current === 0 || submitted}
            onClick={() => setCurrent((c) => c - 1)}
          >
            Previous
          </button>

          {current === questions.length - 1 ? (
            <button
              className="btn btn-danger"
              disabled={submitted}
              onClick={submitExam}
            >
              {submitted ? "Submitting..." : "Submit Exam"}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={submitted}
              onClick={() => setCurrent((c) => c + 1)}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </>
  );
}