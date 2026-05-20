import { useState, useEffect } from "react";
import api from "../api";
import { notify } from "../utils/notify";

export default function CodingProblemManager() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [tags, setTags] = useState("");
  const [testCases, setTestCases] = useState([{ input: "", expectedOutput: "", isHidden: false }]);

  const loadProblems = async () => {
    try {
      const res = await api.get("/problems");
      setProblems(res.data);
    } catch (err) {
      notify("Failed to load problems", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expectedOutput: "", isHidden: false }]);
  };

  const removeTestCase = (index) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const updateTestCase = (index, field, value) => {
    const newTestCases = [...testCases];
    newTestCases[index][field] = value;
    setTestCases(newTestCases);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title,
        description,
        difficulty,
        tags: tags.split(",").map(t => t.trim()).filter(t => t),
        testCases
      };
      await api.post("/problems", payload);
      notify("Problem created successfully", "success");
      
      // Reset form
      setTitle("");
      setDescription("");
      setDifficulty("Easy");
      setTags("");
      setTestCases([{ input: "", expectedOutput: "", isHidden: false }]);
      loadProblems();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to create problem", "error");
    }
  };

  const setAsDaily = async (problemId) => {
    try {
      await api.post("/daily/set-today", { problemId });
      notify("Daily challenge updated", "success");
    } catch (err) {
      notify("Failed to update daily challenge", "error");
    }
  };

  return (
    <div className="space-y-8">
      {/* Create Problem Form */}
      <div className="card bg-white dark:bg-slate-900 border-none shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 p-8">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Create Coding Problem</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="input-field border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 w-full"
              placeholder="Problem Title (e.g. Two Sum)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <select
              className="input-field border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 w-full"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <textarea
            className="input-field border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 w-full h-32"
            placeholder="Problem Description (Markdown supported)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <input
            className="input-field border p-3 rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 w-full"
            placeholder="Tags (comma separated, e.g. Array, Hash Table)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-700 dark:text-slate-300">Test Cases</h4>
              <button 
                type="button" 
                onClick={addTestCase}
                className="text-emerald-600 font-bold text-sm hover:underline"
              >
                + Add Test Case
              </button>
            </div>
            
            {testCases.map((tc, index) => (
              <div key={index} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-3 relative">
                <button 
                  type="button"
                  onClick={() => removeTestCase(index)}
                  className="absolute top-2 right-2 text-red-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Input</label>
                    <textarea 
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg text-sm"
                      value={tc.input}
                      onChange={(e) => updateTestCase(index, "input", e.target.value)}
                      placeholder="e.g. [2,7,11,15], 9"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Expected Output</label>
                    <textarea 
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-lg text-sm"
                      value={tc.expectedOutput}
                      onChange={(e) => updateTestCase(index, "expectedOutput", e.target.value)}
                      placeholder="e.g. [0,1]"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <input 
                    type="checkbox" 
                    checked={tc.isHidden} 
                    onChange={(e) => updateTestCase(index, "isHidden", e.target.checked)}
                  />
                  Hidden Test Case (only for evaluation)
                </label>
              </div>
            ))}
          </div>

          <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-lg shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors">
            Create Problem
          </button>
        </form>
      </div>

      {/* Problem List */}
      <div className="card bg-white dark:bg-slate-900 border-none shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 p-8">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Manage Problems</h3>
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b dark:border-slate-800">
                  <th className="pb-3 font-bold text-slate-500 uppercase text-xs">Title</th>
                  <th className="pb-3 font-bold text-slate-500 uppercase text-xs">Difficulty</th>
                  <th className="pb-3 font-bold text-slate-500 uppercase text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800">
                {problems.map((p) => (
                  <tr key={p._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 font-bold text-slate-800 dark:text-slate-200">{p.title}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        p.difficulty === "Easy" ? "bg-emerald-100 text-emerald-700" :
                        p.difficulty === "Medium" ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {p.difficulty}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => setAsDaily(p._id)}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-colors"
                      >
                        Set as Daily
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
