import axiosInstance from "@/lib/axios"

// Upload floor plans


interface UploadFloorPlansData {
    newFiles: File[]
    existingUrls: string[]
    replaceAll: boolean
}

type UploadFloorPlansInput = File[] | UploadFloorPlansData

// Updated uploadFloorPlans service function
export const uploadFloorPlans = async (eventId: string, uploadData: UploadFloorPlansInput) => {
    try {
        console.log(uploadData)
        const formData = new FormData();

        // If uploadData is an object with structured data (new format)
        if (uploadData && typeof uploadData === 'object' && 'replaceAll' in uploadData && uploadData.replaceAll) {
            const structuredData = uploadData as UploadFloorPlansData

            // Add new files
            if (structuredData.newFiles && structuredData.newFiles.length > 0) {
                structuredData.newFiles.forEach((file) => {
                    formData.append("floorPlans", file);
                });
            }

            // Add existing URLs that should be kept
            if (structuredData.existingUrls && structuredData.existingUrls.length > 0) {
                formData.append("existingUrls", JSON.stringify(structuredData.existingUrls));
            }

            // Add flag to indicate this is a complete replacement
            formData.append("replaceAll", "true");
        }
        // Legacy format - just files array
        else if (Array.isArray(uploadData)) {
            uploadData.forEach((file) => {
                formData.append("floorPlans", file);
            });
        }
        // Single file or files array (backward compatibility)
        else {
            // This case shouldn't happen with our new types, but keeping for safety
            console.warn('Unexpected uploadData format:', uploadData)
        }

        const response = await axiosInstance.post(`/add-floor-plans/${eventId}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        })

        if (!response.data) {
            const errorData = await response;
            throw new Error(errorData.data?.message || "Failed to upload floor plans");
        }

        const data = await response;
        return data.data;
    } catch (error) {
        console.error("Error uploading floor plans:", error);
        throw error;
    }
};

export const getStallTypesByEventId = async (eventId: string) => {
    try {
        const response = await axiosInstance.get(`/stall-types/${eventId}`)
        return response.data.data
    } catch (error) {
        console.error("Error fetching stall types by event ID:", error)
        throw error
    }
}

// Create a new stall type
export const createStallTypeByEventId = async (eventId: string, stallType: any) => {
    try {
        const response = await axiosInstance.post(`/stall-types/${eventId}`, stallType)
        return response.data
    } catch (error) {
        throw error
    }
}

// Update an existing stall type
export const updateStallTypeById = async (
    stallTypeId: string,
    stallTypeData: any
) => {
    try {
        const response = await axiosInstance.patch(`/stall-types/${stallTypeId}`, stallTypeData)
        return response.data.data
    } catch (error) {
        throw error
    }
}

export const getStallsByTypeId = async (stallTypeId: string) => {
    try {
        const response = await axiosInstance.get(`/stalls/${stallTypeId}`)
        return response.data.data
    } catch (error) {
        console.error("Error fetching stalls by type ID:", error)
        throw error
    }
}

export const getStallsByEventId = async (eventId: string) => {
    try {
        const response = await axiosInstance.get(`/stalls/event/${eventId}`)
        console.log(response.data.data)
        return response.data.data.stalls
    }
    catch (error:any) {
        if(error.status === 404) {
            return []
        }
        console.error("Error fetching stalls by event ID:", error)
        throw error
    }
}

export const createStallWithType = async (stallTypeId: string, stallName: any) => {
    try {
        const stallBody= {
            stallTypeId: stallTypeId,
            name: stallName
        }
        const response = await axiosInstance.post(`/create-stalls`, stallBody)
        return response.data.data
    } catch (error) {
        console.error("Error creating stall with type:", error)
        throw error
    }
}

export const createMultipleStallsWithType = async (stallTypeId: string, stallNames: string[]) => {
    try {
        const name = stallNames.join(", ")
        const stallBody = {
            stallTypeId: stallTypeId,
            name: name
        }
        const response = await axiosInstance.post(`/stalls/multiple`, stallBody)
        return response.data.data
    }
    catch (error) {
        console.error("Error creating multiple stalls with type:", error)
        throw error
    }
}
// Delete a stall type
export const deleteStallTypeById = async (stallTypeId: string) => {
    try {
        const response = await axiosInstance.delete(`/stall-types/${stallTypeId}`)
        return response.data
    } catch (error) {
        throw error
    }
}

export const deleteStallByStallId = async (stallId: string) => {
    try{
        const response = await axiosInstance.delete(`/stalls/${stallId}`)
        return response.data
    }
    catch (error) {
        console.error("Error deleting stall by ID:", error)
        throw error
    }
}