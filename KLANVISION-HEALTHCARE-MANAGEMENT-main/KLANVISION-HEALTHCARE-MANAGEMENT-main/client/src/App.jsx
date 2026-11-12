import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Shell from "./components/Shell";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DoctorsPage from "./pages/DoctorsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import AdminDoctorsPage from "./pages/AdminDoctorsPage";
import AdminPatientsPage from "./pages/AdminPatientsPage";
import { useAuth } from "./context/AuthContext";

function Landing() {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading"><span className="spinner" />Loading your workspace...</div>;
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Shell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<ProtectedRoute roles={["patient", "doctor", "admin"]} />}>
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/history" element={<AppointmentsPage history />} />
          </Route>
          <Route element={<ProtectedRoute roles={["patient", "doctor", "admin"]} />}>
            <Route path="/appointments" element={<AppointmentsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
            <Route path="/admin/patients" element={<AdminPatientsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
