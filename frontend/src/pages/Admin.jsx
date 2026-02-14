import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState([]);

  // add question form states
  const [question, setQuestion] = useState("");
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");
  const [opt4, setOpt4] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");

  // ================= FETCH DATA =================
  useEffect(() => {
    api.get("/admin/stats").then(res => setStats(res.data));
    loadQuestions();
  }, []);

  const loadQuestions = () => {
    api.get("/exam/questions").then(res => setQuestions(res.data));
  };

  // ================= ADD QUESTION =================
  const addQuestion = async () => {
    if (![opt1, opt2, opt3, opt4].includes(correctAnswer)) {
  alert("Correct answer must match one of the options exactly");
  return;
}

    if (!question || !correctAnswer) {
      alert("Question and correct answer required");
      return;
    }

    await api.post("/admin/question", {
      question,
      options: [opt1, opt2, opt3, opt4],
      correctAnswer
    });

    // reset form
    setQuestion("");
    setOpt1("");
    setOpt2("");
    setOpt3("");
    setOpt4("");
    setCorrectAnswer("");

    loadQuestions();
    alert("Question added");
  };

  // ================= DELETE QUESTION =================
  const deleteQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;

    await api.delete(`/admin/question/${id}`);
    setQuestions(qs => qs.filter(q => q._id !== id));
  };

  if (!stats) return null;

  return (
    <>
      <Navbar />

      <div className="max-w-5xl mx-auto mt-10 space-y-10">

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card text-center">
            <p className="text-gray-500">Questions</p>
            <p className="text-3xl font-bold">{stats.questions}</p>
          </div>
          <div className="card text-center">
            <p className="text-gray-500">Students</p>
            <p className="text-3xl font-bold">{stats.students}</p>
          </div>
          <div className="card text-center">
            <p className="text-gray-500">Attempts</p>
            <p className="text-3xl font-bold">{stats.attempts}</p>
          </div>
        </div>

        {/* ===== ADD QUESTION ===== */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Add Question</h3>

          <input
            className="border p-2 w-full mb-2"
            placeholder="Question"
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />

          <input className="border p-2 w-full mb-2" placeholder="Option 1"
            value={opt1} onChange={e => setOpt1(e.target.value)} />
          <input className="border p-2 w-full mb-2" placeholder="Option 2"
            value={opt2} onChange={e => setOpt2(e.target.value)} />
          <input className="border p-2 w-full mb-2" placeholder="Option 3"
            value={opt3} onChange={e => setOpt3(e.target.value)} />
          <input className="border p-2 w-full mb-2" placeholder="Option 4"
            value={opt4} onChange={e => setOpt4(e.target.value)} />

          <input
            className="border p-2 w-full mb-4"
            placeholder="Correct Answer (must match option)"
            value={correctAnswer}
            onChange={e => setCorrectAnswer(e.target.value)}
          />

          <button className="btn btn-primary" onClick={addQuestion}>
            Add Question
          </button>
        </div>

        {/* ===== QUESTION LIST ===== */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">All Questions</h3>

          {questions.length === 0 && (
            <p className="text-gray-500">No questions added yet</p>
          )}

          {questions.map(q => (
            <div
              key={q._id}
              className="flex justify-between items-center border-b py-2"
            >
              <span>{q.question}</span>
              <button
                onClick={() => deleteQuestion(q._id)}
                className="btn btn-danger text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
