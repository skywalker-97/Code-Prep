import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";
import { jwtDecode } from "jwt-decode";

export default function Home() {
  let role = null;
  if (isLoggedIn()) role = jwtDecode(localStorage.getItem("token")).role;

  return (
    <>
      <Navbar />

      <div className="text-center mt-24">
        <h1 className="text-4xl font-bold mb-4">Code Prep</h1>
        <p className="text-gray-600 mb-6">
          Online Examination Platform (MERN Stack)
        </p>

        {!isLoggedIn() && (
          <>
            <Link to="/login" className="btn">Login</Link>
            <Link to="/register" className="btn ml-4">Register</Link>
          </>
        )}

        {isLoggedIn() && role === "student" && (
          <Link to="/exam" className="btn">Start Exam</Link>
        )}

        {isLoggedIn() && role === "admin" && (
          <Link to="/admin" className="btn bg-purple-600">Admin Dashboard</Link>
        )}
      </div>
    </>
  );
}
