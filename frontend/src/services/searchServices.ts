import axiosInstance from "@/lib/axios"

export const searchEvents = async (params: URLSearchParams) => {
    try {
        const response = await axiosInstance.get("/events", { params })
        return response.data
    } catch (error) {
        throw new Error("Failed to fetch search results")
    }
}