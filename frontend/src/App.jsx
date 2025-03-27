import { Routes, Route } from "react-router";
import './App.css'
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";
import TaskBoard from "./pages/TaskBoard";
import Login from "./pages/Login";


function App() {
  
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<TaskBoard />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App
