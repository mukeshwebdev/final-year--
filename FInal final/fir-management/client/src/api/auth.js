import api from "./axios";

export const authAPI = {
  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    return data;
  },
  getMe: async () => {
    const { data } = await api.get("/auth/me");
    return data;
  },
  refresh: async (refreshToken) => {
    const { data } = await api.post("/auth/refresh", { refreshToken });
    return data;
  },
  changePassword: async (currentPassword, newPassword) => {
    const { data } = await api.post("/auth/change-password", { currentPassword, newPassword });
    return data;
  },
};
