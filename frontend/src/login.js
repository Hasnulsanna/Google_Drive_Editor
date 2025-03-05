

import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./config";

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Sign in to Continue</h2>
        <button onClick={handleLogin} className="login-btn">Sign in with Google</button>
      </div>
    </div>
  );
};

export default Login;
