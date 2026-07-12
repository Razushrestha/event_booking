import axiosInstance from "@/lib/axios";

export const getLandingPageData = async () => { 
    try {
        const response = await axiosInstance.get("/");
        return response.data.data;
    } catch (error) {
        throw error;
    }
}
