import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated } from "../util/auth";
import LoginForm from "../components/LoginForm";

const Login = () => {
  const navigate = useNavigate();

  // If already logged in, block access to login page
  useEffect(() => {
    try {
      const hasToken = isAuthenticated();
      const hasUser = !!localStorage.getItem("user");
      if (hasToken && hasUser) {
        navigate("/", { replace: true });
      }
    } catch (_) {}
  }, [navigate]);

  return <LoginForm />;
};

export default Login;
