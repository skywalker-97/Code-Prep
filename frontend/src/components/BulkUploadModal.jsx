import { useState, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import api from "../api";
import { notify } from "../utils/notify";

export default function BulkUploadModal({ isOpen, onClose, onSuccess }) {
  const [tab, setTab] = useState("file"); // "file" or "manual"
  const [file, setFile] = useState(null);
  const [manualText, setManualText] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [previewPage, setPreviewPage] = useState(0);
  const [uploading, setUploading] = useState(false);
  
  const [transactionMode, setTransactionMode] = useState("partial");
  const [examId, setExamId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionType, setQuestionType] = useState("single");
  
  const fileInputRef = useRef(null);
  
  const PREVIEW_PAGE_SIZE = 10;

  if (!isOpen) return null;

  const handleClose = () => {
    setFile(null);
    setManualText("");
    setPreviewData([]);
    setPreviewPage(0);
    onClose();
  };

  const downloadTemplate = (type) => {
    const data = [
      {
        question: "What is React?",
        optionA: "Backend",
        optionB: "Frontend",
        optionC: "Database",
        optionD: "OS",
        correctAnswer: "Frontend",
        marks: 1,
        negativeMarks: 0.25,
        explanation: "React is a JS library for building UIs.",
        difficulty: "Medium",
        questionType: "single"
      }
    ];

    if (type === "csv") {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "question_template.csv");
      link.click();
    } else {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, "question_template.xlsx");
    }
  };

  const parseFileLocally = (selectedFile) => {
    setPreviewData([]);
    setPreviewPage(0);
    
    if (selectedFile.name.endsWith(".csv")) {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreviewData(results.data);
        }
      });
    } else if (selectedFile.name.endsWith(".xlsx")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        setPreviewData(json);
      };
      reader.readAsArrayBuffer(selectedFile);
    } else {
      notify("Unsupported file type. Use .csv or .xlsx", "error");
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      parseFileLocally(droppedFile);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseFileLocally(selectedFile);
    }
  };

  const parseManualText = () => {
    if (!manualText.trim()) return;
    
    const questions = [];
    // Split by lines and filter out empty ones
    const allLines = manualText.split("\n").map(l => l.trim()).filter(Boolean);
    
    let currentQuestion = null;

    allLines.forEach((line) => {
      // Check if line starts with a number like "1.", "19.", "Q1:", etc.
      const isQuestionStart = line.match(/^(?:Question:?|Q:?|\d+[\).])\s+/i);
      const isOption = line.match(/^[A-Da-d][\).]\s+/i);
      const isAnswer = line.match(/(?:Answer|Ans)[\s:]+/i);

      if (isQuestionStart) {
        if (currentQuestion && currentQuestion.question && currentQuestion.optionA) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          question: line.replace(/^(?:Question:?|Q:?|\d+[\).])\s+/i, "").trim(),
          optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: ""
        };
      } else if (isOption && currentQuestion) {
        const optLetter = line.match(/^([A-Da-d])[\).]/i)[1].toUpperCase();
        const optText = line.replace(/^[A-Da-d][\).]\s*/, "").trim();
        if (optLetter === "A") currentQuestion.optionA = optText;
        if (optLetter === "B") currentQuestion.optionB = optText;
        if (optLetter === "C") currentQuestion.optionC = optText;
        if (optLetter === "D") currentQuestion.optionD = optText;
      } else if (isAnswer && currentQuestion) {
        const match = line.match(/(?:Answer|Ans)[\s:]*(.*)/i);
        let ans = match ? match[1].trim() : "";
        // Map A, B, C, D to actual text
        if (ans.toUpperCase() === "A") ans = currentQuestion.optionA;
        else if (ans.toUpperCase() === "B") ans = currentQuestion.optionB;
        else if (ans.toUpperCase() === "C") ans = currentQuestion.optionC;
        else if (ans.toUpperCase() === "D") ans = currentQuestion.optionD;
        currentQuestion.correctAnswer = ans;
      } else if (currentQuestion && !currentQuestion.optionA) {
        // Append to question text if no options found yet
        currentQuestion.question += " " + line;
      }
    });

    if (currentQuestion && currentQuestion.question && currentQuestion.optionA) {
      questions.push(currentQuestion);
    }
    
    setPreviewData(questions);
    setPreviewPage(0);
    notify(`Parsed ${questions.length} questions from text`, "success");
  };

  const downloadErrorReport = (errors) => {
    if (!errors || errors.length === 0) return;
    const errorData = errors.map(err => ({
      Row: err.row,
      Error: err.error,
      Question: err.data?.question || ""
    }));
    const ws = XLSX.utils.json_to_sheet(errorData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Errors");
    XLSX.writeFile(wb, "upload_errors.xlsx");
  };

  const handleUpload = async () => {
    if (previewData.length === 0) {
      notify("No data to upload", "error");
      return;
    }
    
    setUploading(true);
    try {
      let res;
      if (tab === "file" && file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("transactionMode", transactionMode);
        formData.append("examId", examId);
        formData.append("subjectId", subjectId);
        formData.append("topicId", topicId);
        formData.append("difficulty", difficulty);
        formData.append("questionType", questionType);
        
        res = await api.post("/admin/questions/bulk-upload", formData);
      } else {
        res = await api.post("/admin/questions/bulk-upload", {
          questions: previewData,
          transactionMode,
          examId,
          subjectId,
          topicId,
          difficulty,
          questionType
        });
      }
      
      if (res.data.failedRows > 0) {
        notify(`Uploaded ${res.data.successRows}. Failed ${res.data.failedRows}.`, "warning");
        downloadErrorReport(res.data.errors);
      } else {
        notify(`Successfully uploaded ${res.data.successRows} questions!`, "success");
      }
      
      if (res.data.successRows > 0) {
        onSuccess();
        handleClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Upload failed";
      notify(msg, "error");
      if (err.response?.data?.errors) {
        downloadErrorReport(err.response.data.errors);
      }
    } finally {
      setUploading(false);
    }
  };

  const previewSlice = previewData.slice(
    previewPage * PREVIEW_PAGE_SIZE,
    (previewPage + 1) * PREVIEW_PAGE_SIZE
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 overflow-y-auto pt-10 pb-10">
      <div className="bg-slate-900 w-full max-w-5xl rounded-xl shadow-2xl p-6 border border-slate-700 m-4">
        
        <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4">
          <h2 className="text-2xl font-bold">Bulk Question Upload</h2>
          <button onClick={handleClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="md:col-span-1 space-y-3 border-r border-slate-700 pr-4">
            <h3 className="font-semibold text-slate-300 border-b border-slate-700 pb-2">Global Settings</h3>
            
            <div>
              <label className="text-xs text-slate-400">Transaction Mode</label>
              <select className="w-full bg-slate-800 border border-slate-600 rounded p-1.5 mt-1 text-sm" value={transactionMode} onChange={e => setTransactionMode(e.target.value)}>
                <option value="partial">Partial Success</option>
                <option value="all_or_nothing">All or Nothing</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs text-slate-400">Exam ID / Name</label>
              <input className="w-full bg-slate-800 border border-slate-600 rounded p-1.5 mt-1 text-sm" value={examId} onChange={e => setExamId(e.target.value)} placeholder="e.g. JEE Main" />
            </div>
            
            <div>
              <label className="text-xs text-slate-400">Subject</label>
              <input className="w-full bg-slate-800 border border-slate-600 rounded p-1.5 mt-1 text-sm" value={subjectId} onChange={e => setSubjectId(e.target.value)} placeholder="e.g. Physics" />
            </div>
            
            <div>
              <label className="text-xs text-slate-400">Topic</label>
              <input className="w-full bg-slate-800 border border-slate-600 rounded p-1.5 mt-1 text-sm" value={topicId} onChange={e => setTopicId(e.target.value)} placeholder="e.g. Kinematics" />
            </div>

            <div>
              <label className="text-xs text-slate-400">Default Difficulty</label>
              <select className="w-full bg-slate-800 border border-slate-600 rounded p-1.5 mt-1 text-sm" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400">Question Type</label>
              <select className="w-full bg-slate-800 border border-slate-600 rounded p-1.5 mt-1 text-sm" value={questionType} onChange={e => setQuestionType(e.target.value)}>
                <option value="single">Single Choice</option>
                <option value="multiple">Multiple Choice</option>
                <option value="true-false">True/False</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col h-[500px]">
            <div className="flex gap-4 mb-4 border-b border-slate-700 pb-2">
              <button className={`font-semibold pb-1 ${tab === 'file' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-400'}`} onClick={() => setTab("file")}>
                File Upload
              </button>
              <button className={`font-semibold pb-1 ${tab === 'manual' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-400'}`} onClick={() => setTab("manual")}>
                Manual Paste
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {tab === "file" ? (
                <div className="h-full flex flex-col">
                  <div className="flex gap-3 mb-4">
                    <button onClick={() => downloadTemplate("csv")} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded border border-slate-600">↓ CSV Template</button>
                    <button onClick={() => downloadTemplate("xlsx")} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded border border-slate-600">↓ Excel Template</button>
                  </div>
                  
                  <div 
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleFileDrop}
                    className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center bg-slate-800/50 hover:bg-slate-800 transition cursor-pointer mb-4 flex-shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <p className="text-slate-400 mb-2">Drag and drop your .csv or .xlsx file here</p>
                    <p className="text-slate-500 text-sm">or click to browse (Max 5MB)</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx" onChange={handleFileSelect} />
                  </div>
                  {file && <p className="text-sm text-emerald-400 mb-4 flex-shrink-0">Selected: {file.name}</p>}
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <p className="text-xs text-slate-400 mb-2 flex-shrink-0">Paste questions in format: Question \n Option A \n Option B ... \n Answer</p>
                  <textarea 
                    className="w-full flex-1 bg-slate-800 border border-slate-600 rounded p-3 text-sm font-mono focus:outline-none focus:border-emerald-500 mb-3"
                    value={manualText}
                    onChange={e => setManualText(e.target.value)}
                    placeholder="1. What is React?&#10;(a) Backend&#10;(b) Frontend&#10;(c) OS&#10;(d) DB&#10;Ans: Frontend"
                  />
                  <button onClick={parseManualText} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded self-end mb-4 flex-shrink-0">
                    Parse Text
                  </button>
                </div>
              )}

              {previewData.length > 0 && (
                <div className="mt-4 border-t border-slate-700 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Preview ({previewData.length} questions found)</h4>
                    <div className="flex gap-2">
                      <button 
                        disabled={previewPage === 0} 
                        onClick={() => setPreviewPage(p => p - 1)}
                        className="px-2 py-1 bg-slate-800 rounded disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span className="text-sm self-center">Page {previewPage + 1} of {Math.ceil(previewData.length / PREVIEW_PAGE_SIZE)}</span>
                      <button 
                        disabled={(previewPage + 1) * PREVIEW_PAGE_SIZE >= previewData.length} 
                        onClick={() => setPreviewPage(p => p + 1)}
                        className="px-2 py-1 bg-slate-800 rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto bg-slate-800 rounded border border-slate-700">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-700 text-slate-300">
                        <tr>
                          <th className="p-2 border-b border-slate-600">Question</th>
                          <th className="p-2 border-b border-slate-600">Correct Answer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewSlice.map((row, i) => (
                          <tr key={i} className="border-b border-slate-700">
                            <td className="p-2 truncate max-w-xs" title={row.question}>{row.question}</td>
                            <td className="p-2 text-emerald-400">{row.correctAnswer}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-700 pt-4 mt-4">
          <button onClick={handleClose} className="px-5 py-2 rounded border border-slate-600 hover:bg-slate-800">
            Cancel
          </button>
          <button 
            onClick={handleUpload} 
            disabled={uploading || previewData.length === 0}
            className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 flex items-center"
          >
            {uploading ? (
              <><span className="animate-spin mr-2">↻</span> Uploading...</>
            ) : "Submit All"}
          </button>
        </div>
      </div>
    </div>
  );
}
