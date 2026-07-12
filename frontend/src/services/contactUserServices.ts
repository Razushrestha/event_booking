import axiosInstance from "@/lib/axios";

export const submitContactForm = async (formdata: any) => {
    try {
        console.log(formdata)
        const response = await axiosInstance.post("/contact", formdata);
        return response.data;
    } catch (error) {
        throw error;
    }
}