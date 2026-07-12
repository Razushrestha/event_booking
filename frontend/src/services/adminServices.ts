import axiosInstance from "@/lib/axios"

export const addAdmin = async (email: string, password: string) => {
    try {
        const response = await axiosInstance.post("/admin/add", { email, password });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error;
    }
}