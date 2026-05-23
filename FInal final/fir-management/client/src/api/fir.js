import api from "./axios";

export const firAPI = {
  list: (params) => api.get("/firs", { params }).then((r) => r.data),
  get: (id) => api.get(`/firs/${id}`).then((r) => r.data),
  create: (formData) => api.post("/firs", formData, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data),
  update: (id, data) => api.put(`/firs/${id}`, data).then((r) => r.data),
  updateStatus: (id, status) => api.patch(`/firs/${id}/status`, { status }).then((r) => r.data),
  assign: (id, assignedToId) => api.patch(`/firs/${id}/assign`, { assignedToId }).then((r) => r.data),
  addLog: (id, note) => api.post(`/firs/${id}/investigation-log`, { note }).then((r) => r.data),
  downloadPDF: (id) => api.get(`/firs/${id}/pdf`, { responseType: "blob" }).then((r) => r.data),
  getSummary: (id) => api.get(`/firs/${id}/summary`).then((r) => r.data),
  checkDuplicates: (description) => api.post("/firs/check-duplicates", { description }).then((r) => r.data),
  generateChargesheet: (id, content) => api.post(`/firs/${id}/chargesheet`, { content }).then((r) => r.data),
  trackByNumber: (firNumber) => api.get(`/firs/track/${firNumber}`).then((r) => r.data),
};
