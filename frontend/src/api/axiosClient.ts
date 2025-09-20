import axios from "axios";


const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const axiosClient = axios.create({
  baseURL,
});

// request interceptor → add token
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// response interceptor → handle expired token
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");
                if (!refreshToken) throw new Error("No refresh token");

                const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });

                localStorage.setItem("accessToken", res.data.accessToken);
                localStorage.setItem("refreshToken", res.data.refreshToken);

                axiosClient.defaults.headers.common.Authorization = `Bearer ${res.data.accessToken}`;
                originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;

                return axiosClient(originalRequest);
            } catch (refreshError) {
                console.error("Token refresh failed", refreshError);
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user"); 
                return Promise.reject(refreshError); 
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;