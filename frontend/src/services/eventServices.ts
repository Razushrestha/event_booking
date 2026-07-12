import axiosInstance from "@/lib/axios";

export const addEventByAdmin = async (formdata: any) => {
    try {
        const response = await axiosInstance.post("/add-event", formdata);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateEventByAdmin = async (formdata: any) => {
    try {
        const response = await axiosInstance.patch(`/update-event`, formdata);
        console.log(response.data);
        return response.data;
    }
    catch (error) {
        throw error;
    }
}

export const getAllAdminEvents = async () => {
    try {
        const response = await axiosInstance.get("/events");
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getEventById = async (id: string) => {
    try {
        const response = await axiosInstance.get(`/events/${id}`);
        // console.log(response.data);
        return response.data.data;
    } catch (error) {
        throw error;
    }
}


export const getEventDashboard = async (queryParams: { sortBy?: string, search?: string, page?: number } = {}) => {
    try {
        const response = await axiosInstance.get("/admin/events", {
            params: queryParams
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const deleteEventByAdmin = async (id: string) => {
    try {
        const response = await axiosInstance.delete(`/admin/event/${id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getTermsAndConditions = async (eventId: string) => {
    try {
        const response = await axiosInstance.get(`/terms-and-conditions/${eventId}`);
        return response.data.data; // Assuming GenRes wraps data in 'data' field
    } catch (error) {
        throw new Error("Failed to fetch terms and conditions");
    }
};

export const saveTermsAndConditions = async (eventId: string, termsAndConditions: string) => {
    try {
        const response = await axiosInstance.post(`/terms-and-conditions/${eventId}`, { termsAndConditions });
        return response.data;
    } catch (error) {
        throw new Error("Failed to save terms and conditions");
    }
};