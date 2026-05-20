import { useEffect, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import api from "../api";

export default function Notes() {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState("");

  const loadNotes = useCallback(async () => {
    const params = filter ? `?topic=${encodeURIComponent(filter)}` : "";
    const res = await api.get(`/notes${params}`);
    setNotes(res.data || []);
  }, [filter]);

  useEffect(() => {
    loadNotes().catch(() => setNotes([]));
  }, [loadNotes]);

  const addNote = async () => {
    if (!topic.trim() || !content.trim()) return;
    await api.post("/notes", { topic, content });
    setTopic("");
    setContent("");
    loadNotes();
  };

  const deleteNote = async (id) => {
    await api.delete(`/notes/${id}`);
    loadNotes();
  };

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-5">
        <section className="lg:col-span-1 card h-fit">
          <h2 className="text-xl font-bold">Add Note</h2>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic (e.g. DP)"
            className="mt-3 w-full border rounded-lg p-2 bg-transparent"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your notes..."
            className="mt-3 w-full border rounded-lg p-2 bg-transparent"
            rows={8}
          />
          <button className="mt-3 px-4 py-2 rounded-lg bg-emerald-600 text-white" onClick={addNote}>
            Save Note
          </button>
        </section>

        <section className="lg:col-span-2 card">
          <div className="flex flex-wrap justify-between gap-2 items-center">
            <h2 className="text-xl font-bold">My Notes</h2>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by topic"
              className="border rounded-lg p-2 bg-transparent"
            />
          </div>

          <div className="mt-4 space-y-3">
            {notes.map((note) => (
              <div key={note._id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-emerald-600">{note.topic}</p>
                    <p className="whitespace-pre-wrap mt-2">{note.content}</p>
                  </div>
                  <button className="text-red-600 text-sm" onClick={() => deleteNote(note._id)}>Delete</button>
                </div>
              </div>
            ))}
            {notes.length === 0 && <p className="text-slate-500">No notes yet.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
