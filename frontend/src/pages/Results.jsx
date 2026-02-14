import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";


export default function Results() {
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/results/my-results")
      .then(res => setResults(res.data))
      .catch(() => alert("Failed to load results"));
  }, []);

  useEffect(() => {
  if (!localStorage.getItem("token")) {
    navigate("/login");
  }
}, [navigate]);


  return (
    <>
      <Navbar />

      <div className="max-w-3xl mx-auto mt-10 space-y-6">
        <h2 className="text-2xl font-bold">My Results</h2>

        {results.length === 0 && (
          <p className="text-gray-500">No attempts yet</p>
        )}

        {results.map((r, i) => {
          const percentage = Math.round(
            (r.score / r.totalQuestions) * 100
          );

          const status = percentage >= 40 ? "PASS" : "FAIL";

          return (
            <div key={i} className="card">
              <p className="text-lg font-semibold">
                Score: {r.score}/{r.totalQuestions}
              </p>

              <p>
                Percentage: <b>{percentage}%</b>
              </p>

              <p className={`font-bold ${
                status === "PASS"
                  ? "text-green-600"
                  : "text-red-600"
              }`}>
                {status}
              </p>

              <p className="text-sm text-gray-500">
                Attempted on:{" "}
                {new Date(r.createdAt).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </>
  );
}
