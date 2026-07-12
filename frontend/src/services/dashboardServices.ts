import axiosInstance from "@/lib/axios";

export const getDashboardData = async () => {
    try {
        const response = await axiosInstance.get("/admin/dashboard");
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

export const getPendingTickets = async (page: number, limit: number = 5) => {
    try {
        const response = await axiosInstance.get(`/admin/pending-tickets?page=${page}&limit=${limit}`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

export const getRecentRegistrations = async (page: number, limit: number = 5) => {
    try {
        const response = await axiosInstance.get(`/admin/recent-registrations?page=${page}&limit=${limit}`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

export const getUpcomingEvents = async (page: number, limit: number = 6) => {
    try {
        const response = await axiosInstance.get(`/admin/upcoming-events?page=${page}&limit=${limit}`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};

export const getTickets = async (params: {
    page?: number;
    limit?: number;
    status?: string;
    eventId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: string;
}) => {
    try {
        const queryParams = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value.toString());
            }
        });

        const response = await axiosInstance.get(`/admin/tickets?${queryParams.toString()}`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
};