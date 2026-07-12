import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
        return null;
    }

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/refresh-token`, {
        refreshToken,
    });

    const nextAccessToken = response.data?.accessToken;
    const nextRefreshToken = response.data?.refreshToken;

    if (nextAccessToken) {
        localStorage.setItem("token", nextAccessToken);
    }

    if (nextRefreshToken) {
        localStorage.setItem("refreshToken", nextRefreshToken);
    }

    return nextAccessToken || null;
}

axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers = AxiosHeaders.from({
                ...config.headers,
                Authorization: `Bearer ${token}`,
            });
        }

        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._retry ||
            originalRequest.url?.includes("/refresh-token") ||
            originalRequest.url?.includes("/login")
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            if (!refreshPromise) {
                refreshPromise = refreshAccessToken().finally(() => {
                    refreshPromise = null;
                });
            }

            const nextAccessToken = await refreshPromise;

            if (!nextAccessToken) {
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                return Promise.reject(error);
            }

            originalRequest.headers = AxiosHeaders.from({
                ...originalRequest.headers,
                Authorization: `Bearer ${nextAccessToken}`,
            });

            return axiosInstance(originalRequest);
        } catch (refreshError) {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            return Promise.reject(refreshError);
        }
    }
);

export default axiosInstance;
