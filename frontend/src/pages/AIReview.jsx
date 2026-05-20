import { useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api";
import { notify } from "../utils/notify";

export default function AIReview() {
  const [language, setLanguage] = useState("javascript");
  const [prompt, setPrompt] = useState("Find bugs and optimize for interviews");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const review = async () => {
    try {
      setLoading(true);
      const res = await api.post("/ai/review", { code, language, prompt });
      setResult(res.data);
    } catch (err) {
      notify(err.response?.data?.message || "AI review failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-2 gap-5">
        <section className="card">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Code Review</h1>
          <p className="text-slate-500 mt-1">Explain, optimize and catch likely mistakes.</p>

          <div className="flex gap-2 mt-4">
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border rounded-lg p-2 bg-transparent">
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="border rounded-lg p-2 bg-transparent flex-1"
              placeholder="Custom review prompt"
            />
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={16}
            className="w-full mt-3 border rounded-lg p-3 bg-transparent font-mono text-sm"
            placeholder="Paste your code here"
          />

          <button
            disabled={loading || !code.trim()}
            onClick={review}
            className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-60"
          >
            {loading ? "Reviewing..." : "Review Code"}
          </button>
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold">Feedback</h2>
          {!result && <p className="text-slate-500 mt-3">No review yet.</p>}

          {result && (
            <>
              <p className="text-sm mt-3 text-slate-500">Provider: {result.provider}</p>
              <p className="mt-3">{result.summary}</p>
              <ul className="mt-4 list-disc pl-5 space-y-2">
                {(result.suggestions || []).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </>
  );
}
