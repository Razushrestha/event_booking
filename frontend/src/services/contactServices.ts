import axiosInstance from "@/lib/axios";

export const getContacts = async () => {
    try {
        const response = await axiosInstance.get("/contact");
        return response.data.data;
    } catch (error) {
        console.error("Error fetching contacts:", error);
        throw error;
    }
};

export const deleteContacts = async (id: string) => {
    try {
        const response = await axiosInstance.delete(`/contact/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting contact:", error);
        throw error;
    }
}
