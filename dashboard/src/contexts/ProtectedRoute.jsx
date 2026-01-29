import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const isLogin = sessionStorage.getItem("isLogin") === "true";

  if (!isLogin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
