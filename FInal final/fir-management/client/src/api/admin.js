import api from "./axios";

export const adminAPI = {
  getUsers: (params) => api.get("/admin/users", { params }).then((r) => r.data),
  createUser: (data) => api.post("/admin/users", data).then((r) => r.data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data).then((r) => r.data),
  resetPassword: (id, newPassword) => api.post(`/admin/users/${id}/reset-password`, { newPassword }).then((r) => r.data),
  getAuditLogs: (params) => api.get("/admin/audit-logs", { params }).then((r) => r.data),
  getAnalytics: () => api.get("/admin/analytics").then((r) => r.data),
};
