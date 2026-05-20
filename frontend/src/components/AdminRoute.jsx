import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/admin-login" />;
  }

  let decoded;
  try {
    decoded = JSON.parse(atob(token.split(".")[1]));
  } catch {
    localStorage.removeItem("token");
    return <Navigate to="/admin-login" replace />;
  }

  if (decoded.role !== "admin") {
    return <Navigate to="/" />;
  }

  return children;
}
