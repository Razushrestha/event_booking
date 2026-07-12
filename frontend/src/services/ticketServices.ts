import axiosInstance from "@/lib/axios";

export const registerTicketByUser = async (formData: any) => {
    try {
        const response = await axiosInstance.post("/register-tickets", formData);
        return response.data;
    } catch (error) {
        throw new Error("Failed to register ticket");
    }
}

export const getTicketsOfUser = async () => {
    try {
        const response = await axiosInstance.get("/tickets");
        return response.data.data;
    } catch (error) {
        throw new Error("Failed to fetch tickets");
    }
}

export const getTicketsByEventId = async ({
    eventId,
    page = 1,
    status,
    search,
    sortBy = 'createdAt'
}: {
    eventId: string;
    page?: number;
    status?: string;
    search?: string;
    sortBy?: string;
}) => {
    try {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        if (status && status !== "all") params.append("status", status);
        if (search) params.append("search", search);
        if (sortBy) params.append("sortBy", sortBy);

        const response = await axiosInstance.get(`/tickets/event/${eventId}?${params.toString()}`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};



export const getTicketById = async (ticketId: string) => {
    try {
        const response = await axiosInstance.get(`/tickets/${ticketId}`);
        return response.data.data;
    }
    catch (error) {
        throw error;
    }
}

export const registerTicket = async (formdata: any) => {
    try {
        const response = await axiosInstance.post("/register-tickets", formdata);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const deleteTicket = async (ticketId: string) => {
    try {
        const response = await axiosInstance.delete(`/tickets/${ticketId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const approveTicketByAdmin = async (ticketId: string) => {
    try {
        const response = await axiosInstance.post("/admin/approve-ticket", {
            ticketId
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const rejectTicketByAdmin = async (ticketId: string, rejectionReason: string) => {
    try {
        const response = await axiosInstance.post("/admin/reject-ticket", {
            ticketId, note: rejectionReason
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getTicketDashboard = async (params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    eventId?: string;
}) => {
    try {
        const response = await axiosInstance.get("/admin/tickets", { params });
        return response.data;
    } catch (error) {
        throw new Error("Failed to fetch ticket dashboard data");
    }
};

export const exportTicketsCSV = async (eventId: string) => {
    try {
        const response = await axiosInstance.get(`/tickets/export/${eventId}`, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        throw new Error("Failed to export tickets to CSV");
    }
}