import axiosInstance from "@/lib/axios"

export const getPaymentMethods = async () => {
    try {
        const response = await axiosInstance.get("/payment-methods")
        return response.data
    } catch (error) {
        throw new Error("Failed to fetch payment methods")
    }
}

export const createPaymentMethod = async (data: FormData) => {
    try {
        const response = await axiosInstance.post("/payment-methods", data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
    } catch (error) {
        throw new Error("Failed to create payment method")
    }
}

export const updatePaymentMethod = async (id: string, data: FormData) => {
    try {
        const response = await axiosInstance.put(`/payment-methods/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        console.log(response.data)
        return response.data
    } catch (error) {
        throw new Error("Failed to update payment method")
    }
}

export const deletePaymentMethod = async (id: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/payment-methods/${id}`)
    } catch (error) {
        throw new Error("Failed to delete payment method")
    }
}