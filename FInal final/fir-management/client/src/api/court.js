import api from "./axios";

export const courtAPI = {
  getHearings: (firId) => api.get(`/court/fir/${firId}/hearings`).then((r) => r.data),
  addHearing: (firId, data) => api.post(`/court/fir/${firId}/hearings`, data).then((r) => r.data),
  updateHearing: (hearingId, data) => api.put(`/court/hearings/${hearingId}`, data).then((r) => r.data),
  getUpcoming: () => api.get("/court/upcoming").then((r) => r.data),
  getTimeline: (firId) => api.get(`/court/fir/${firId}/timeline`).then((r) => r.data),
  sendReminder: (hearingId) => api.post(`/court/hearings/${hearingId}/remind`).then((r) => r.data),
};
