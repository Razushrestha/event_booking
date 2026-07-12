import axiosInstance from "@/lib/axios"

export const getTeamMembers = async () => {
    try {
        const response = await axiosInstance.get("/our-team")
        return response.data
    } catch (error) {
        throw new Error("Failed to fetch team members")
    }
}

export const createTeamMember = async (data: FormData) => {
    try {
        const response = await axiosInstance.post("/our-team", data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        return response.data
    } catch (error) {
        throw new Error("Failed to create team member")
    }
}

export const updateTeamMember = async (id: string, data: FormData) => {
    try {
        console.log(data)
        const response = await axiosInstance.put(`/our-team/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        console.log(response.data)
        return response.data
    } catch (error) {
        throw new Error("Failed to update team member")
    }
}

export const deleteTeamMember = async (id: string): Promise<void> => {
    try {
        await axiosInstance.delete(`/our-team/${id}`)
    } catch (error) {
        throw new Error("Failed to delete team member")
    }
}

export const getTeamMemberById = async (id: string) => {
    try {
        const response = await axiosInstance.get(`/our-team/${id}`)
        return response.data
    } catch (error) {
        throw new Error("Failed to fetch team member")
    }
}