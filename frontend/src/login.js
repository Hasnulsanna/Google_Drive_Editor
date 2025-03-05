

import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    window.location.href = "http://localhost:5000/auth/google";
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
