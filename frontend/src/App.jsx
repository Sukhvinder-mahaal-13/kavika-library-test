import { Routes, Route, Navigate } from "react-router-dom";

// User Pages
import Register from "./pages/user/Register";
import WaitingRoom from "./pages/user/WaitingRoom";
import TestPage from "./pages/user/TestPage";
import ResultPage from "./pages/user/ResultPage";
import StudentResults from "./pages/user/Results";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CreateTest from "./pages/admin/CreateTest";
import ManageQuestions from "./pages/admin/ManageQuestions";
import StudentDetails from "./pages/admin/studentDetails";
import UserInfo from "./pages/admin/UserInfo";
import Results from "./pages/admin/Results";

function App() {
    return (
        <Routes>
            {/* User Routes */}
            <Route path="/" element={<Register />} />
            <Route path="/waiting-room" element={<WaitingRoom />} />
            <Route path="/test/:testId" element={<TestPage />} />
            <Route path="/result/:testId" element={<ResultPage />} />

            {/* Student My Results */}
           <Route path="/my-results" element={<StudentResults />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/create-test" element={<CreateTest />} />
            <Route path="/admin/results" element={<Results />} />

            {/* User Information */}
            <Route path="/admin/user-info" element={<UserInfo />} />

            {/* Student Details */}
            <Route
                path="/admin/students/:studentId"
                element={<StudentDetails />}
            />

            {/* Manage Questions */}
            <Route
                path="/admin/tests/:testId/questions"
                element={<ManageQuestions />}
            />

            {/* Unknown Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;