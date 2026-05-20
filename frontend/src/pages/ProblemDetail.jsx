import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api";
import { notify } from "../utils/notify";
import Editor from "@monaco-editor/react";

const DEFAULT_SNIPPETS = {
  javascript: "function solve(input) {\n  // Write your code here\n  console.log('Hello World');\n  return input;\n}",
  python: "def solve(input):\n    # Write your code here\n    print('Hello World')\n    return input",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    cout << \"Hello World\" << endl;\n    return 0;\n}",
  java: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code here\n        System.out.println(\"Hello World\");\n    }\n}"
};

export default function ProblemDetail() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("description"); // description, console

  useEffect(() => {
    api.get(`/problems/${id}`)
      .then((res) => {
        setProblem(res.data);
        const starter = res.data?.starterCode?.[language] || DEFAULT_SNIPPETS[language];
        setCode(starter);
      })
      .catch(() => setProblem(null));
  }, [id, language]);

  const runCode = async () => {
    try {
      setLoading(true);
      setActiveTab("console");
      const res = await api.post("/code/run-code", {
        code,
        language,
        input
      });
      setStatus(res.data.status || "Ran");
      setOutput(res.data.output || res.data.stderr || res.data.compileOutput || "No output");
      notify("Code execution completed", "success");
    } catch (err) {
      setStatus("Error");
      const errorMsg = err.response?.data?.message || "Failed to run code. Ensure Judge0 is configured.";
      setOutput(errorMsg);
      notify(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    try {
      setLoading(true);
      setActiveTab("console");
      const res = await api.post("/submissions/submit", {
        problemId: id,
        code,
        language
      });

      setStatus(res.data.status);
      setOutput(`Submission ${res.data.status}. Score: ${res.data.score}\n\n${res.data.details || ""}`);
      if (res.data.status === "Accepted") {
        notify("Congratulations! Problem Solved", "success");
      } else {
        notify(`Submission ${res.data.status}`, "warning");
      }
    } catch (err) {
      setStatus("Error");
      setOutput(err.response?.data?.message || "Submit failed");
      notify("Submission failed", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!problem) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="animate-pulse">Loading problem engine...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col max-h-screen overflow-hidden">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden border-t border-slate-800">
        {/* Left Side: Description */}
        <div className="w-full md:w-1/2 flex flex-col border-r border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveTab("description")}
                className={`text-sm font-bold uppercase tracking-widest px-2 py-1 transition-all ${activeTab === "description" ? "text-emerald-500 border-b-2 border-emerald-500" : "text-slate-500"}`}
              >
                Description
              </button>
            </div>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              problem.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-500" : 
              problem.difficulty === "Medium" ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500"
            }`}>
              {problem.difficulty}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <h1 className="text-3xl font-black text-white mb-4">{problem.title}</h1>
            <div className="flex gap-2 mb-8">
              {problem.tags?.map(t => (
                <span key={t} className="px-2 py-1 bg-slate-800 text-slate-400 text-[10px] font-bold rounded uppercase tracking-wider">#{t}</span>
              ))}
            </div>

            <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-p:leading-relaxed">
              <p className="whitespace-pre-wrap">{problem.description}</p>
            </div>

            {problem.testCases?.length > 0 && (
              <div className="mt-12 space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Examples
                </h3>
                {problem.testCases.map((tc, i) => !tc.isHidden && (
                  <div key={i} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-800">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Input</p>
                        <code className="bg-slate-900 px-3 py-2 rounded-lg block text-emerald-400 text-sm font-mono">{tc.input || "(empty)"}</code>
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Output</p>
                        <code className="bg-slate-900 px-3 py-2 rounded-lg block text-white text-sm font-mono">{tc.expectedOutput || "(empty)"}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Editor & Console */}
        <div className="w-full md:w-1/2 flex flex-col bg-slate-950">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-800 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python 3</option>
                <option value="cpp">C++ 17</option>
                <option value="java">Java 13</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={runCode}
                disabled={loading}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-black hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                Run
              </button>
              <button 
                onClick={submitCode}
                disabled={loading}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
              >
                Submit
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-0 relative">
            <Editor
              height="100%"
              language={language === "python" ? "python" : language === "cpp" ? "cpp" : "javascript"}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                lineNumbers: "on",
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                padding: { top: 20 }
              }}
            />
          </div>

          {/* Console / Output Area */}
          <div className={`h-1/3 border-t border-slate-800 flex flex-col bg-slate-900 transition-all duration-300 ${activeTab === "console" ? "translate-y-0" : "translate-y-0"}`}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab("console")}
                  className={`text-[10px] font-black uppercase tracking-widest ${activeTab === "console" ? "text-emerald-500" : "text-slate-500"}`}
                >
                  Console Output
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  status === "Accepted" ? "bg-emerald-500/20 text-emerald-500" : 
                  status === "Error" ? "bg-rose-500/20 text-rose-500" : "bg-slate-800 text-slate-400"
                }`}>
                  {status || "Ready"}
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm custom-scrollbar">
              {output ? (
                <pre className="text-slate-300 whitespace-pre-wrap">{output}</pre>
              ) : (
                <p className="text-slate-600 italic">Run your code to see the output here...</p>
              )}
            </div>

            {/* Custom Input Panel (mini) */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-4 items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase">Input</span>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. [2,7,11,15], 9"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
