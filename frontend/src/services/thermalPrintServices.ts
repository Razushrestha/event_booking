import axiosInstance from "@/lib/axios";

export const createThermalPrintJob = async (data: { mainHeader: string, line1: string, line2: string, line3: string, totalPrints: string }) => {
    try {
        const response = await axiosInstance.post("/thermal-prints", data);
        return response.data;
    } catch (error) {
        throw new Error("Failed to create thermal print job");
    }
};