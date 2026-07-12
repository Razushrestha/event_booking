import axiosInstance from "@/lib/axios";

export const addEmployee = async (employeeData: any) => {
    try {
        const response = await axiosInstance.post("/admin/add-employee", employeeData);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const editEmployee = async (employeeId: string, employeeData: any) => {
    try {
        employeeData = {
            ...employeeData,
            userId: employeeId
        };
        const response = await axiosInstance.patch(`/admin/edit-employee`, employeeData);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const deleteEmployee = async (email: string) => {
    try {
        const response = await axiosInstance.delete(`/admin/delete-employee`, { data: { email: email } });
        return response.data;
    } catch (error) {
        throw error;
    }
}