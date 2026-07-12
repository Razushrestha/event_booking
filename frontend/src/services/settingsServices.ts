import axiosInstance from "@/lib/axios";

export const changePassword = async (formData: any) => {
    try {
        formData = {
            ...formData,
            oldPassword: formData.currentPassword.trim(),
            newPassword: formData.newPassword.trim(),
            confirmPassword: formData.newPassword.trim() // Assuming confirmPassword is the same as newPassword
        };
        const response = await axiosInstance.post("/change-password", formData);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const changeEmail = async (formData: any) => {
    try {
        formData = {
            email: formData.email.trim()
        };
        const response = await axiosInstance.post("/update-user", formData);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const updateUserProfile = async (formData: any) => {
    try {
        formData = {
            name: formData.displayName.trim(),
            phone: formData.phone.trim(),
        };
        const response = await axiosInstance.post("/update-user", formData);
        return response.data;
    } catch (error) {
        throw error;
    }
}