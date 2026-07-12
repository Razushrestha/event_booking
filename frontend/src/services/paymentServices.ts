import axiosInstance from "@/lib/axios";

export const approvePayment = async (bookingId: string, paymentId: string) => {
    try {
        const response = await axiosInstance.post(`/payments/approve`, { bookingId ,paymentId });
        return response.data.data;
    } catch (error) {
        throw error;
    }
}

export const rejectPayment = async (bookingId: string, paymentId: string, paymentCancelNote?: string) => {
    try {
        const response = await axiosInstance.post(`/payments/cancel`, { bookingId, paymentId, failedNote: paymentCancelNote });
        return response.data.data;
    } catch (error) {
        throw error;
    }
}

export const giveDiscountByAdmin = async (bookingId: string, discount: number) => {
    try {
        const response = await axiosInstance.post(`/payments/discount`, { bookingId, discountAmount: discount });
        return response.data.data;
    } catch (error) {
        throw error;
    }
}