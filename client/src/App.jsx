import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Import components from Components/
import Dashboard from "./Components/Dashboard";
import History from "./Components/HistoryPage";
import Login from "./Components/Login";
import ResumeUploadForm from "./Components/ResumeUploadForm"; // Resume & Preferences
import Signup from "./Components/Signup";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/preferences" element={<ResumeUploadForm />} />
        <Route path="/history" element={<History />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
