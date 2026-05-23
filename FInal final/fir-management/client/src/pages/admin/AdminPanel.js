import React, { useEffect, useState } from "react";
import { adminAPI } from "../../api/admin";
import LoadingSpinner from "../../components/LoadingSpinner";

const ROLES = ["SUPER_ADMIN", "INSPECTOR", "SI", "WRITER", "CITIZEN"];

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "WRITER", badgeNumber: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getUsers({ limit: 50 });
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadAuditLogs = async (page = 1) => {
    setLoading(true);
    try {
      const data = await adminAPI.getAuditLogs({ page, limit: 30 });
      setAuditLogs(data.logs || []);
      setAuditTotal(data.total || 0);
      setAuditPage(page);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === "users") loadUsers();
    else if (activeTab === "audit") loadAuditLogs(1);
  }, [activeTab]);

  const setField = (k) => (e) => setNewUser((p) => ({ ...p, [k]: e.target.value }));

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true); setError("");
    try {
      await adminAPI.createUser(newUser);
      setShowCreateForm(false);
      setNewUser({ name: "", email: "", password: "", role: "WRITER", badgeNumber: "" });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await adminAPI.updateUser(user.id, { isActive: !user.isActive });
      loadUsers();
    } catch (err) {
      alert("Failed to update user");
    }
  };

  const roleBadge = { SUPER_ADMIN: "bg-purple-100 text-purple-800", INSPECTOR: "bg-red-100 text-red-800", SI: "bg-orange-100 text-orange-800", WRITER: "bg-blue-100 text-blue-800", CITIZEN: "bg-green-100 text-green-800" };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Manage users, view audit logs, system settings</p>
        </div>
        {activeTab === "users" && (
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary">
            {showCreateForm ? "✕ Cancel" : "+ Create User"}
          </button>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {[["users", `Users (${total})`], ["audit", "Audit Logs"]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500"}`}>
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "users" && (
        <>
          {showCreateForm && (
            <div className="card">
              <h3 className="font-semibold text-gray-700 mb-4">Create New User</h3>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}
              <form onSubmit={handleCreateUser} className="grid grid-cols-2 gap-4">
                <div><label className="label">Full Name *</label><input className="input-field" value={newUser.name} onChange={setField("name")} required /></div>
                <div><label className="label">Email *</label><input className="input-field" type="email" value={newUser.email} onChange={setField("email")} required /></div>
                <div><label className="label">Password *</label><input className="input-field" type="password" value={newUser.password} onChange={setField("password")} minLength={6} required /></div>
                <div><label className="label">Role *</label>
                  <select className="input-field" value={newUser.role} onChange={setField("role")}>
                    {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div><label className="label">Badge Number</label><input className="input-field" value={newUser.badgeNumber} onChange={setField("badgeNumber")} placeholder="e.g. P-1234" /></div>
                <div className="flex items-end">
                  <button type="submit" disabled={creating} className="btn-primary w-full">{creating ? "Creating..." : "Create User"}</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{["Name", "Email", "Role", "Badge", "Status", "Created", "Actions"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium text-xs">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{u.name}</td>
                      <td className="py-3 px-4 text-gray-500">{u.email}</td>
                      <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge[u.role]}`}>{u.role?.replace("_", " ")}</span></td>
                      <td className="py-3 px-4 text-gray-500 font-mono text-xs">{u.badgeNumber || "—"}</td>
                      <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                      <td className="py-3 px-4">
                        <button onClick={() => handleToggleActive(u)} className={`text-xs ${u.isActive ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}>
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "audit" && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-48"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                <p className="text-sm text-gray-600">{auditTotal} total log entries</p>
                <div className="flex gap-2">
                  <button disabled={auditPage <= 1} onClick={() => loadAuditLogs(auditPage - 1)} className="btn-secondary text-xs py-1 px-2 disabled:opacity-50">← Prev</button>
                  <span className="text-xs text-gray-500 py-1">Page {auditPage}</span>
                  <button disabled={auditPage * 30 >= auditTotal} onClick={() => loadAuditLogs(auditPage + 1)} className="btn-secondary text-xs py-1 px-2 disabled:opacity-50">Next →</button>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{["User", "Role", "Action", "Entity", "IP Address", "Timestamp"].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium text-xs">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800 font-medium">{log.user?.name || "—"}</td>
                      <td className="py-3 px-4"><span className={`text-xs px-1.5 py-0.5 rounded ${roleBadge[log.user?.role] || "bg-gray-100 text-gray-600"}`}>{log.user?.role}</span></td>
                      <td className="py-3 px-4 font-mono text-xs text-blue-700">{log.action}</td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{log.entity}</td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-xs">{log.ipAddress || "—"}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
