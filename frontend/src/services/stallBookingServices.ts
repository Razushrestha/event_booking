import axiosInstance from "@/lib/axios"

export const getAllStallsByEventId = async (eventId: string) => {
    try {
        const response = await axiosInstance.get(`/stalls/event/${eventId}`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching all stalls by event ID:", error);
        throw error;
    }
}

export const getStallByStallId = async (stallIds: string[]) => {
    try {
        const ids = stallIds.join(",");
        const response = await axiosInstance.get(`/stalls/${ids}`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching stall by stall IDs:", error);
        throw error;
    }
}

export const bookStallByOrganizer = async (bookingData: any) => {
    try {
        const response = await axiosInstance.post(`/bookings/multiple`, bookingData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Error booking stall by organizer:", error);
        throw error;
    }
}

export const bookStallByAdmin = async (bookingData: any) => {
    try{
        const response = await axiosInstance.post(`/bookings/multiple/admin`, bookingData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Error booking stall by admin:", error);
        throw error;
    }
}

export const holdStallByOrganizer = async (holdData: any) => {
    try {
        const response = await axiosInstance.post(`/bookings/multiple/hold`, holdData);
        return response.data;
    } catch (error) {
        console.error("Error holding stall by organizer:", error);
        throw error;
    }
}
