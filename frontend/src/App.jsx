import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";

import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Users from "./pages/Users";
import Classes from "./pages/Classes";
import ClassDetails from "./pages/ClassDetails";
import Levels from "./pages/Levels";
import LevelDetails from "./pages/LevelDetails";
import LevelCurriculum from "./pages/LevelCurriculum";
import LecturePage from "./pages/LecturePage";
import BulkStudentUpload from "./pages/BulkStudentUpload";
import BulkAllStudents from "./pages/BulkAllStudents";
import AddStudent from "./pages/AddStudent";
import UserDetails from "./pages/UserDetails";

const App = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/users" element={<Users />} />
        <Route path="/users/:userId" element={<UserDetails />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/classes/:id" element={<ClassDetails />} />
        <Route
          path="/classes/:classId/bulk-upload"
          element={<BulkStudentUpload />}
        />
        <Route path="/bulk-upload" element={<BulkAllStudents />} />
        <Route path="/classes/:classId/add-student" element={<AddStudent />} />
        <Route path="/levels" element={<Levels />} />
        <Route path="/levels/:levelId" element={<LevelDetails />} />
        <Route
          path="/levels/:levelId/curriculum"
          element={<LevelCurriculum />}
        />
        <Route
          path="/levels/:levelId/curriculum/:subject/semesters/:semester/lectures/:lecture"
          element={<LecturePage />}
        />
      </Routes>
    </div>
  );
};

export default App;
