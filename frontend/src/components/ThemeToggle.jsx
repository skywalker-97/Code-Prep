import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const useDark = saved ? saved === "dark" : prefersDark;
    setDark(useDark);
    document.documentElement.classList.toggle("dark", useDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm"
    >
      {dark ? "Light" : "Dark"}
    </button>
  );
}
