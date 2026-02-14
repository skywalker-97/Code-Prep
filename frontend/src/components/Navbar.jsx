import { NavLink, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";


export default function Navbar() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  let role = null;

  if (token) {
    try {
      role = jwtDecode(token).role;
    } catch {
      localStorage.removeItem("token");
    }
  }

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded ${
      isActive ? "bg-blue-100 text-blue-600" : "hover:bg-gray-100"
    }`;

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">

        {/* LOGO */}
        <NavLink to="/" className="font-bold text-blue-600 text-lg">
          Code Prep
        </NavLink>

        {/* LINKS */}
        <div className="flex gap-4 items-center">

          {/* NOT LOGGED IN */}
          {!token && (
            <>
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                Register
              </NavLink>
            </>
          )}

          {/* STUDENT */}
          {token && role === "student" && (
            <>
              <NavLink to="/exam" className={linkClass}>
                Exam
              </NavLink>
              <NavLink to="/results" className={linkClass}>
                Results
              </NavLink>
              <button
                onClick={logout}
                className="btn btn-danger text-sm"
              >
                Logout
              </button>
            </>
          )}

          {/* ADMIN */}
          {token && role === "admin" && (
            <>
              <NavLink to="/admin" className={linkClass}>
                Admin
              </NavLink>
              <button
                onClick={logout}
                className="btn btn-danger text-sm"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
