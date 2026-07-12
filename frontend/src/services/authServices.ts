import axiosInstance from "@/lib/axios";

export const login = async (email: string, password: string) => {
    try {
        const response = await axiosInstance.post("/login", {
            email,
            password,
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
}

export const orgLogin = async ({
    displayName,
    email,
    uid,
    idToken,
}: {
    displayName: string;
    email: string;
    uid: string;
    idToken?: string;
}) => {
    try {
        const response = await axiosInstance.post("/org/login/google", {
            fullName: displayName,
            email,
            uid,
            idToken,
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
}

export const register = async (fullName: string, email: string, password: string, phone: string) => {
    try {
        const response = await axiosInstance.post("/register", {
            fullName,
            email,
            password,
            phone
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
}

export const orgRegister = async (fullName: string, email: string, password: string, phone: string) => {
    try {
        const response = await axiosInstance.post("/org/register", {
            fullName,
            email,
            password,
            phone
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
}

export const googleLogin = async ({
    displayName,
    email,
    uid,
    idToken,
}: {
    displayName: string;
    email: string;
    uid: string;
    idToken?: string;
}) => {
    try {
        const response = await axiosInstance.post("/login/google", {
            fullName: displayName,
            email,
            uid,
            idToken,
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
}

export const logout = async () => {
    try {
        await axiosInstance.post("/logout");
    } catch {
        // Clear local session even if the API call fails.
    }
}

export const storeAuthTokens = (accessToken?: string, refreshToken?: string) => {
    if (accessToken) {
        localStorage.setItem("token", accessToken);
    }

    if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
    }
}
