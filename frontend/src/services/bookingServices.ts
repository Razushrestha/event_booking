import axiosInstance from "@/lib/axios";

export const getBookingsDashboard = async () => {
    try {
        const response = await axiosInstance.get("/admin/bookings");
        return response.data.data;
    } catch (error) {
        throw error;
    }
}

export const getAllBookingsByAdmin = async ({
    page = 1,
    status,
    paymentStatus,
    search,
    sortBy = 'newest'
}: {
    page?: number
    status?: string
    paymentStatus?: string
    search?: string
    sortBy?: string
}) => {
    try {
        const params = new URLSearchParams()
        params.append("page", page.toString())
        if (status && status !== "all") params.append("status", status)
        if (paymentStatus && paymentStatus !== "all") params.append("paymentStatus", paymentStatus)
        if (search) params.append("search", search)
        if (sortBy) params.append("sortBy", sortBy)

        const response = await axiosInstance.get(`/bookings?${params.toString()}`)
        return response.data.data
    } catch (error) {
        throw error
    }
}

export const deleteBookingByAdmin = async (bookingId: string) => {
    try {
        const response = await axiosInstance.delete(`/bookings/${bookingId}`);
        return response.data
    } catch (error) {
        throw error;
    }
}

export const getBookingsByEventId = async ({
    eventId,
    page = 1,
    status,
    paymentStatus,
    search,
    sortBy = 'newest'
}: {
    eventId: string
    page?: number
    status?: string
    paymentStatus?: string
    search?: string
    sortBy?: string
}) => {
    try {
        const params = new URLSearchParams()
        params.append("page", page.toString())
        if (status && status !== "all") params.append("status", status)
        if (paymentStatus && paymentStatus !== "all") params.append("paymentStatus", paymentStatus)
        if (search) params.append("search", search)
        if (sortBy) params.append("sortBy", sortBy)

        const response = await axiosInstance.get(`/bookings/event/${eventId}?${params.toString()}`)
        return response.data.data
    } catch (error) {
        throw error
    }
}

export const getBookingByBookingId = async (bookingId: string) => {
    try {
        const response = await axiosInstance.get(`/bookings/${bookingId}`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
}

export const confirmBookingByAdmin = async (bookingId: string) => {
    try {
        const response = await axiosInstance.post(`/bookings/approve/${bookingId}`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
}

export const cancelBookingByAdmin = async (bookingId: string, reason: string) => {
    try {
        const body = { reason: reason };
        const response = await axiosInstance.post(`/bookings/cancel/${bookingId}`, body);
        return response.data.data;
    } catch (error) {
        throw error;
    }
}

export const exportBookingsCSV = async (eventId: string) => {
    try {
        const response = await axiosInstance.get(`/bookings/export/${eventId}`, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}