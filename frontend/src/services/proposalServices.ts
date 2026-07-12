import axiosInstance from "@/lib/axios";

export const addProposalByAdmin = async (eventId: string, formdata: any) => {
    try {
        const response = await axiosInstance.post(`/add-proposal/${eventId}`, formdata);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const editProposalByAdmin = async (eventId: string, formdata: any) => {
    try {
        const response = await axiosInstance.patch(`/edit-proposal/${eventId}`, formdata);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteProposalByAdmin = async (eventId: string) => {
    try {
        const response = await axiosInstance.delete(`/delete-proposal/${eventId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}