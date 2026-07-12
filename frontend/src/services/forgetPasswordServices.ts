import axiosInstance from "@/lib/axios";

export const submitForgetPassword = async (email: string) => {
    try {
        console.log(email)
        const response = await axiosInstance.post("/forget-password", {email});
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const submitVerifyandResetPassword = async (email: string, enteredCode:string, newPassword:string) => {
    try {
        console.log(email)
        const response = await axiosInstance.post("/verify-code", {email, enteredCode, newPassword});
        return response.data;
    } catch (error) {
        throw error;
    }
}