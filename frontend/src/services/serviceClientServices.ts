import axiosInstance from "@/lib/axios";

export const getServiceClientData = async () => {
    try {
        const response = await axiosInstance.get("/services");
        return response.data.data;
    } catch (error) {
        throw error;
    }
}