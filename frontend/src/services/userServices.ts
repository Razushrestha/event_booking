import axiosInstance from "@/lib/axios";

interface UserData {
    _id: string
    email: string
    role: "admin" | "user"
    userId: string
    createdAt: string
    updatedAt: string
    __v: number
    name?: string
}

interface Pagination {
    currentPage: number
    totalPages: number
    totalUsers: number
    hasNextPage: boolean
    hasPrevPage: boolean
    nextPage: number | null
    prevPage: number | null
    limit: number
    skip: number
}

interface Filters {
    search: string | null
    sortBy: string
    sortOrder: string
}

interface UsersResponse {
    users: UserData[]
    pagination: Pagination
    filters: Filters
}

interface ApiResponse {
    status: number
    success: boolean
    data: UsersResponse
    error: null | any
    message: string
    timestamp: string
}
export const getAllUsers = async (params?: {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}): Promise<UsersResponse> => {
    try {
        const queryParams = new URLSearchParams()

        if (params?.page) queryParams.append('page', params.page.toString())
        if (params?.limit) queryParams.append('limit', params.limit.toString())
        if (params?.search) queryParams.append('search', params.search)
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy)
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder)

        const response = await axiosInstance.get<ApiResponse>(`/admin/users?${queryParams.toString()}`)
        return response.data.data
    } catch (error) {
        throw error
    }
}

export const getUserDetailByUser = async () =>{
    try {
        const response = await axiosInstance.get(`/users/me`);
        return response.data.data;
    } catch (error) {
        throw error;
    }
}