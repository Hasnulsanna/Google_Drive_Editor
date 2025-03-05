import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./login";
import Editor from "./editor";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/editor" element={<Editor />} />
      </Routes>
    </Router>
  );
}

export default App;
