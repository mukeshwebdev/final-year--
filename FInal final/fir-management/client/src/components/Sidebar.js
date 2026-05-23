import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = {
  SUPER_ADMIN: [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/firs", label: "All FIRs", icon: "📋" },
    { to: "/fir/new", label: "File FIR", icon: "✍️" },
    { to: "/search", label: "Aadhaar Search", icon: "🔍" },
    { to: "/court", label: "Court Management", icon: "⚖️" },
    { to: "/admin", label: "Admin Panel", icon: "⚙️" },
  ],
  INSPECTOR: [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/firs", label: "All FIRs", icon: "📋" },
    { to: "/search", label: "Aadhaar Search", icon: "🔍" },
    { to: "/court", label: "Court Management", icon: "⚖️" },
  ],
  SI: [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/firs", label: "My Cases", icon: "📋" },
    { to: "/search", label: "Aadhaar Search", icon: "🔍" },
    { to: "/court", label: "Court Hearings", icon: "⚖️" },
  ],
  WRITER: [
    { to: "/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/firs", label: "FIR List", icon: "📋" },
    { to: "/fir/new", label: "File New FIR", icon: "✍️" },
  ],
  CITIZEN: [
    { to: "/dashboard", label: "My Complaints", icon: "📊" },
    { to: "/fir/new", label: "File Complaint", icon: "✍️" },
    { to: "/track", label: "Track FIR", icon: "🔎" },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = navItems[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleBadgeColor = {
    SUPER_ADMIN: "bg-purple-100 text-purple-800",
    INSPECTOR: "bg-red-100 text-red-800",
    SI: "bg-orange-100 text-orange-800",
    WRITER: "bg-blue-100 text-blue-800",
    CITIZEN: "bg-green-100 text-green-800",
  };

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col min-h-screen">
      <div className="p-5 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-xl">🚔</div>
          <div>
            <h1 className="font-bold text-sm leading-tight">FIR Management</h1>
            <p className="text-blue-300 text-xs">Police Station Portal</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-blue-800">
        <p className="text-white font-medium text-sm truncate">{user?.name}</p>
        <p className="text-blue-300 text-xs truncate">{user?.email}</p>
        <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor[user?.role] || "bg-gray-100 text-gray-800"}`}>
          {user?.role?.replace("_", " ")}
        </span>
        {user?.badgeNumber && <p className="text-blue-400 text-xs mt-1">Badge: {user.badgeNumber}</p>}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive ? "bg-blue-700 text-white font-medium" : "text-blue-200 hover:bg-blue-800 hover:text-white"
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-red-700 hover:text-white transition-colors"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
