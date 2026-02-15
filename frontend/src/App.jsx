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
import BulkTeacherUpload from "./pages/BulkTeacherUpload";
import Schedule from "./pages/Schedule";
import AddStudent from "./pages/AddStudent";
import UserDetails from "./pages/UserDetails";
import HymnsLibrary from "./pages/library/HymnsLibrary";
import HymnDetails from "./pages/library/HymnDetails";
import AddEditHymn from "./pages/library/AddEditHymn";
import EventsManagement from "./pages/library/EventsManagement";
import ContactMessages from "./pages/ContactMessages";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/signup"
          element={<ProtectedRoute requireAdmin element={<Signup />} />}
        />
        <Route
          path="/users"
          element={<ProtectedRoute requireAdmin element={<Users />} />}
        />
        <Route
          path="/contact-messages"
          element={<ProtectedRoute requireAdmin element={<ContactMessages />} />}
        />
        <Route path="/users/:userId" element={<UserDetails />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/classes/:id" element={<ClassDetails />} />
        <Route
          path="/classes/:classId/bulk-upload"
          element={
            <ProtectedRoute requireAdmin element={<BulkStudentUpload />} />
          }
        />
        <Route
          path="/bulk-upload"
          element={
            <ProtectedRoute requireAdmin element={<BulkAllStudents />} />
          }
        />
        <Route
          path="/bulk-all-students"
          element={
            <ProtectedRoute requireAdmin element={<BulkAllStudents />} />
          }
        />
        <Route
          path="/bulk-teachers"
          element={
            <ProtectedRoute requireAdmin element={<BulkTeacherUpload />} />
          }
        />
        <Route
          path="/schedule"
          element={<ProtectedRoute requireAdmin element={<Schedule />} />}
        />
        <Route
          path="/classes/:classId/add-student"
          element={<ProtectedRoute requireAdmin element={<AddStudent />} />}
        />
        <Route path="/levels" element={<Levels />} />
        <Route path="/levels/:levelId" element={<LevelDetails />} />
        <Route
          path="/classes/:classId/curriculum"
          element={<LevelCurriculum />}
        />
        <Route
          path="/classes/:classId/curriculum/:subject/semesters/:semester/lectures/:lecture"
          element={<LecturePage />}
        />
        <Route
          path="/hymns"
          element={<ProtectedRoute requireAdmin element={<HymnsLibrary />} />}
        />
        <Route
          path="/hymns/add"
          element={<ProtectedRoute requireAdmin element={<AddEditHymn />} />}
        />
        <Route
          path="/hymns/:id"
          element={<ProtectedRoute requireAdmin element={<HymnDetails />} />}
        />
        <Route
          path="/hymns/:id/edit"
          element={<ProtectedRoute requireAdmin element={<AddEditHymn />} />}
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute requireAdmin element={<EventsManagement />} />
          }
        />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
};

export default App;
