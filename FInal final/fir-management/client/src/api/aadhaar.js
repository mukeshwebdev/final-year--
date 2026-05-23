import api from "./axios";

export const aadhaarAPI = {
  search: (aadhaarNumber) => api.get(`/aadhaar/${aadhaarNumber}`).then((r) => r.data),
  searchCitizen: (query) => api.get("/aadhaar/search", { params: { query } }).then((r) => r.data),
  getWatchlist: () => api.get("/aadhaar/watchlist").then((r) => r.data),
  addToWatchlist: (accusedId, reason) => api.post(`/aadhaar/watchlist/${accusedId}`, { reason }).then((r) => r.data),
  removeFromWatchlist: (accusedId) => api.delete(`/aadhaar/watchlist/${accusedId}`).then((r) => r.data),
};
