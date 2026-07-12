import axiosInstance from "@/lib/axios"

export const getServices = async () => {
    try {
        const response = await axiosInstance.get("/services")
        return response.data
    } catch (error) {
        throw new Error("Failed to fetch services")
    }
}

export const createService = async (data: FormData) => {
    try {
        const response = await axiosInstance.post("/admin/services", data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
    } catch (error) {
        throw new Error("Failed to create service")
    }
}

export const updateService = async (id: string, data: FormData) => {
    try {
        const response = await axiosInstance.patch(`/admin/services/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        console.log(response.data)
        return response.data
    } catch (error) {
        throw new Error("Failed to update service")
    }
}

export const deleteService = async (id: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/admin/services/${id}`)
    } catch (error) {
        throw new Error("Failed to delete service")
    }
}