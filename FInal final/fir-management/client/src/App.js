import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import LoadingSpinner from "./components/LoadingSpinner";

import Login from "./pages/auth/Login";
import SuperAdminDashboard from "./pages/dashboard/SuperAdminDashboard";
import InspectorDashboard from "./pages/dashboard/InspectorDashboard";
import SIDashboard from "./pages/dashboard/SIDashboard";
import WriterDashboard from "./pages/dashboard/WriterDashboard";
import CitizenDashboard from "./pages/dashboard/CitizenDashboard";
import FileFIR from "./pages/fir/FileFIR";
import FIRList from "./pages/fir/FIRList";
import FIRDetail from "./pages/fir/FIRDetail";
import AadhaarSearch from "./pages/search/AadhaarSearch";
import CourtManagement from "./pages/court/CourtManagement";
import AdminPanel from "./pages/admin/AdminPanel";

const Layout = () => (
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar />
    <div className="flex-1 flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  </div>
);

const DashboardRouter = () => {
  const { user } = useAuth();
  if (!user) return <LoadingSpinner />;
  const dashboards = {
    SUPER_ADMIN: <SuperAdminDashboard />,
    INSPECTOR: <InspectorDashboard />,
    SI: <SIDashboard />,
    WRITER: <WriterDashboard />,
    CITIZEN: <CitizenDashboard />,
  };
  return dashboards[user.role] || <div>Unknown role</div>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Loading..." /></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/firs" element={<FIRList />} />
        <Route path="/firs/:id" element={<FIRDetail />} />
        <Route path="/fir/new" element={
          <ProtectedRoute roles={["WRITER", "SUPER_ADMIN", "INSPECTOR", "CITIZEN"]}>
            <FileFIR />
          </ProtectedRoute>
        } />
        <Route path="/search" element={
          <ProtectedRoute roles={["SUPER_ADMIN", "INSPECTOR", "SI", "WRITER"]}>
            <AadhaarSearch />
          </ProtectedRoute>
        } />
        <Route path="/court" element={
          <ProtectedRoute roles={["SUPER_ADMIN", "INSPECTOR", "SI"]}>
            <CourtManagement />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute roles={["SUPER_ADMIN"]}>
            <AdminPanel />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
