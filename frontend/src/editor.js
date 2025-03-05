

import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";

const Editor = () => {
  const [content, setContent] = useState("");
  const [user, setUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:5000/auth/user", { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const savedDraft = localStorage.getItem("draftContent");
    if (savedDraft) {
      setContent(savedDraft);
    }
  }, []);

  const handleContentChange = (value) => {
    setContent(value);
    if (value.trim()) {
      localStorage.setItem("draftContent", value);
    } else {
      localStorage.removeItem("draftContent");
    }
  };

  const saveDraft = () => {
    if (!content.trim()) {
      alert("Cannot save an empty draft!");
      return;
    }
    localStorage.setItem("draftContent", content);
    alert("Draft saved locally!");
  };

  const saveToGoogleDrive = async () => {
    if (!content.trim()) {
      alert("Cannot save an empty document to Google Drive!");
      return;
    }
    setIsSaving(true);

    try {
      await axios.post("http://localhost:5000/save-to-drive", { content }, { withCredentials: true });
      alert("Saved to Google Drive!");
      localStorage.removeItem("draftContent");
    } catch (error) {
      console.error("Error saving:", error.message);
      alert("Failed to save to Google Drive.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await axios.get("http://localhost:5000/auth/logout", { withCredentials: true });
      if (response.status === 200) {
        setUser(null);
        window.location.href = "http://localhost:3000";
      }
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  const clearEditor = () => {
    setContent("");
    localStorage.removeItem("draftContent");
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <h2>Text Editor</h2>
        {user && (
          <div className="user-info">
            <p>Welcome, {user.profile.displayName}!</p>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        )}
      </div>
      <ReactQuill
        value={content}
        onChange={handleContentChange}
        className="quill-editor"
        modules={{
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["clean"],
            [{ align: [] }],
            ["clear"],
          ],
        }}
      />
      <div className="editor-buttons">
        <button onClick={saveDraft} className="save-btn">Save Draft</button>
        <button onClick={clearEditor} className="clear-btn">Clear</button>
        <button onClick={saveToGoogleDrive} className="save-drive-btn" disabled={isSaving}>
          {isSaving ? (
            <>
              <span className="spinner"></span> Saving...
            </>
          ) : (
            "Save to Google Drive"
          )}
        </button>
      </div>
    </div>
  );
};

export default Editor;
