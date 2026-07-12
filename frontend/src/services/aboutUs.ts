import axiosInstance from "@/lib/axios";

export const getOurTeamData = async () => {
    try {
        const response = await axiosInstance.get("/our-team");
        return response.data.data;
    } catch (error) {
        throw error;
    }
}