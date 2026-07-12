"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Building2, Edit, Trash2, X, Save, MapPin, Ruler, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { notifyError, notifySuccess } from "@/components/toast"
import formatCurrency from "../utils/formatCurrency"
import { getStallTypesByEventId, createStallTypeByEventId, updateStallTypeById, deleteStallTypeById } from "@/services/stallSetupServices"

interface StallType {
    typeId?: string
    eventId?: string
    name: string
    sizeInSqFt: number
    size: string
    rate: number
    location: string
    amenities: string[]
    upchargeInPercent: number
    createdAt: string
}

interface StallTypeFormData {
    name: string
    sizeInSqFt: number
    size: string
    rate: number
    location: string
    amenities: string[]
    upchargeInPercent?: number
}

interface StallTypesManagerProps {
    eventId: string
}

const getStallTypes = async (eventId: string): Promise<StallType[]> => {
    try {
        const response = await getStallTypesByEventId(eventId)
        return response
    } catch (error) {
        console.error("Error fetching stall types:", error)
        notifyError("Failed to load stall types")
        return []
    }
}

const createStallType = async (stallTypeData: StallTypeFormData & { eventId: string }): Promise<StallType> => {
    try {
        const response = await createStallTypeByEventId(stallTypeData.eventId, {
            name: stallTypeData.name,
            sizeInSqFt: stallTypeData.sizeInSqFt,
            size: stallTypeData.size,
            rate: stallTypeData.rate,
            location: stallTypeData.location,
            amenities: stallTypeData.amenities,
            upchargeInPercent: stallTypeData.upchargeInPercent,
        })
        console.log("Stall type created successfully:", response)
        return response.data;
    } catch (error) {
        console.error("Error creating stall type:", error)
        throw error
    }
}

const updateStallType = async (
    typeId: string,
    stallTypeData: StallTypeFormData & { eventId: string },
): Promise<StallType> => {
    try {
        const updatedStallType = await updateStallTypeById(typeId, {
            name: stallTypeData.name,
            sizeInSqFt: stallTypeData.sizeInSqFt,
            size: stallTypeData.size,
            rate: stallTypeData.rate,
            location: stallTypeData.location,
            amenities: stallTypeData.amenities,
            upchargeInPercent: stallTypeData.upchargeInPercent,
        })
        return updatedStallType
    } catch (error) {
        console.error("Error updating stall type:", error)
        throw error
    }
}

const deleteStallType = async (typeId: string): Promise<void> => {
    try {
        await deleteStallTypeById(typeId)
    } catch (error) {
        console.error("Error deleting stall type:", error)
        throw error
    }
}

export function StallTypesManager({ eventId }: StallTypesManagerProps) {
    const [stallTypes, setStallTypes] = useState<StallType[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAddingType, setIsAddingType] = useState(false)
    const [editingStallTypeId, setEditingStallTypeId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newAmenity, setNewAmenity] = useState("")
    const [editNewAmenity, setEditNewAmenity] = useState("")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [stallTypeToDelete, setStallTypeToDelete] = useState<StallType | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [pricingType, setPricingType] = useState<"Fixed Price" | "Rate per Area">("Rate per Area")

    const [formData, setFormData] = useState<StallTypeFormData>({
        name: "",
        sizeInSqFt: 0,
        size: "",
        rate: 0,
        location: "",
        amenities: [],
        upchargeInPercent: 0,
    })

    const [editFormData, setEditFormData] = useState<StallTypeFormData>({
        name: "",
        sizeInSqFt: 0,
        size: "",
        rate: 0,
        location: "",
        amenities: [],
        upchargeInPercent: 0,
    })

    useEffect(() => {
        const fetchStallTypes = async () => {
            try {
                setIsLoading(true)
                const data = await getStallTypes(eventId)
                setStallTypes(data)
            } catch (error) {
                console.error("Failed to fetch stall types:", error)
                notifyError("Failed to load stall types")
            } finally {
                setIsLoading(false)
            }
        }

        fetchStallTypes()
    }, [eventId])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: name === "sizeInSqFt" || name === "rate" || name === "upchargeInPercent" ? Number.parseFloat(value) || 0 : value,
        }))
    }

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setEditFormData((prev) => ({
            ...prev,
            [name]: name === "sizeInSqFt" || name === "rate" || name === "upchargeInPercent" ? Number.parseFloat(value) || 0 : value,
        }))
    }

    const handleAddAmenity = () => {
        if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
            setFormData((prev) => ({
                ...prev,
                amenities: [...prev.amenities, newAmenity.trim()],
            }))
            setNewAmenity("")
        }
    }

    const handleEditAddAmenity = () => {
        if (editNewAmenity.trim() && !editFormData.amenities.includes(editNewAmenity.trim())) {
            setEditFormData((prev) => ({
                ...prev,
                amenities: [...prev.amenities, editNewAmenity.trim()],
            }))
            setEditNewAmenity("")
        }
    }

    const handleRemoveAmenity = (amenity: string) => {
        setFormData((prev) => ({
            ...prev,
            amenities: prev.amenities.filter((a) => a !== amenity),
        }))
    }

    const handleEditRemoveAmenity = (amenity: string) => {
        setEditFormData((prev) => ({
            ...prev,
            amenities: prev.amenities.filter((a) => a !== amenity),
        }))
    }

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            notifyError("Stall type name is required")
            return
        }

        if (!formData.size.trim()) {
            notifyError("Size description is required")
            return
        }

        if (formData.rate <= 0) {
            notifyError(pricingType === "Fixed Price" ? "Price must be greater than 0" : "Rate must be greater than 0")
            return
        }

        if (pricingType === "Rate per Area" && formData.sizeInSqFt <= 0) {
            notifyError("Size in square feet must be greater than 0")
            return
        }

        setIsSubmitting(true)

        try {
            const newStallType = await createStallType({
                ...formData,
                eventId,
                sizeInSqFt: pricingType === "Fixed Price" ? 1 : formData.sizeInSqFt,
            })
            setStallTypes((prev) => [...prev, newStallType])

            setFormData({
                name: "",
                sizeInSqFt: pricingType === "Fixed Price" ? 1 : 0,
                size: "",
                rate: 0,
                location: "",
                amenities: [],
                upchargeInPercent: 0,
            })
            setIsAddingType(false)
            setPricingType("Rate per Area")
            notifySuccess("Stall type created successfully")
        } catch (error) {
            notifyError("Failed to create stall type. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (stallType: StallType) => {
        setEditFormData({
            name: stallType.name,
            sizeInSqFt: stallType.sizeInSqFt,
            size: stallType.size,
            rate: stallType.rate,
            location: stallType.location,
            amenities: [...stallType.amenities],
            upchargeInPercent: stallType.upchargeInPercent || 0,
        })
        setPricingType(stallType.sizeInSqFt === 1 ? "Fixed Price" : "Rate per Area")
        setEditingStallTypeId(stallType.typeId ?? null)
    }

    const handleUpdateSubmit = async () => {
        if (!editFormData.name.trim()) {
            notifyError("Stall type name is required")
            return
        }

        if (!editFormData.size.trim()) {
            notifyError("Size description is required")
            return
        }

        if (editFormData.rate <= 0) {
            notifyError(pricingType === "Fixed Price" ? "Price must be greater than 0" : "Rate must be greater than 0")
            return
        }

        if (pricingType === "Rate per Area" && editFormData.sizeInSqFt <= 0) {
            notifyError("Size in square feet must be greater than 0")
            return
        }

        if (!editingStallTypeId) return

        setIsSubmitting(true)

        try {
            const updatedStallType = await updateStallType(editingStallTypeId, {
                ...editFormData,
                eventId,
                sizeInSqFt: pricingType === "Fixed Price" ? 1 : editFormData.sizeInSqFt,
            })
            setStallTypes((prev) => prev.map((st) => (st.typeId === editingStallTypeId ? updatedStallType : st)))

            setEditingStallTypeId(null)
            setEditNewAmenity("")
            setPricingType("Rate per Area")
            notifySuccess("Stall type updated successfully")
        } catch (error) {
            notifyError("Failed to update stall type. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancelEdit = () => {
        setEditingStallTypeId(null)
        setEditNewAmenity("")
        setPricingType("Rate per Area")
        setEditFormData({
            name: "",
            sizeInSqFt: 0,
            size: "",
            rate: 0,
            location: "",
            amenities: [],
            upchargeInPercent: 0,
        })
    }

    const handleCancel = () => {
        setFormData({
            name: "",
            sizeInSqFt: 0,
            size: "",
            rate: 0,
            location: "",
            amenities: [],
            upchargeInPercent: 0,
        })
        setNewAmenity("")
        setIsAddingType(false)
        setPricingType("Rate per Area")
    }

    const handleDeleteClick = (stallType: StallType) => {
        setStallTypeToDelete(stallType)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!stallTypeToDelete || !stallTypeToDelete.typeId) return

        setIsDeleting(true)

        try {
            await deleteStallType(stallTypeToDelete.typeId)
            setStallTypes((prev) => prev.filter((st) => st.typeId !== stallTypeToDelete.typeId))
            notifySuccess("Stall type deleted successfully")
            setDeleteDialogOpen(false)
            setStallTypeToDelete(null)
        } catch (error) {
            notifyError("Failed to delete stall type. Please try again.")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setStallTypeToDelete(null)
    }

    const formatSqFt = (sqFt?: number) => {
        const safeSqFt = typeof sqFt === "number" && !isNaN(sqFt) ? sqFt : 0
        return `${safeSqFt.toFixed(1)} sq ft`
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center">
                                <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                                Stall Types
                            </CardTitle>
                            <CardDescription>Define different types of stalls with their specifications and pricing</CardDescription>
                        </div>
                        {!isAddingType && (
                            <Button onClick={() => setIsAddingType(true)} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Stall Type
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {isAddingType && (
                                <Card className="border-blue-200 bg-blue-50">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Add New Stall Type</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Stall Type Name *</Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., Food Stall, Retail Booth"
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="location">Location</Label>
                                                <Input
                                                    id="location"
                                                    name="location"
                                                    value={formData.location}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., Main Hall, Outdoor Area"
                                                    className="bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="pricingType">Pricing Type *</Label>
                                            <Select
                                                value={pricingType}
                                                onValueChange={(value: "Fixed Price" | "Rate per Area") => {
                                                    setPricingType(value)
                                                    if (value === "Fixed Price") {
                                                        setFormData((prev) => ({ ...prev, sizeInSqFt: 1 }))
                                                    }
                                                }}
                                            >
                                                <SelectTrigger id="pricingType" className="bg-white">
                                                    <SelectValue placeholder="Select pricing type" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    <SelectItem value="Fixed Price" className="hover:bg-gray-100">Fixed Price</SelectItem>
                                                    <SelectItem value="Rate per Area" className="hover:bg-gray-100">Rate per Area</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            {pricingType === "Rate per Area" && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="sizeInSqFt">Size (Square Feet) *</Label>
                                                    <Input
                                                        id="sizeInSqFt"
                                                        name="sizeInSqFt"
                                                        type="number"
                                                        min="0"
                                                        step="0.1"
                                                        value={formData.sizeInSqFt || ""}
                                                        onChange={handleInputChange}
                                                        placeholder="0.0"
                                                        className="bg-white"
                                                    />
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Label htmlFor="size">Size Description *</Label>
                                                <Input
                                                    id="size"
                                                    name="size"
                                                    value={formData.size}
                                                    onChange={handleInputChange}
                                                    placeholder="e.g., 5ft x 5ft, 3m x 4m"
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="rate">{pricingType === "Fixed Price" ? "Price (NRS) *" : "Rate (NRS) *"}</Label>
                                                <Input
                                                    id="rate"
                                                    name="rate"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.rate || ""}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="upchargeInPercent">Upcharge (Percentage)</Label>
                                                <Input
                                                    id="upchargeInPercent"
                                                    name="upchargeInPercent"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.upchargeInPercent || ""}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    className="bg-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Amenities</Label>
                                            <div className="flex space-x-2">
                                                <Input
                                                    value={newAmenity}
                                                    onChange={(e) => setNewAmenity(e.target.value)}
                                                    placeholder="Add amenity (e.g., Power outlet, WiFi)"
                                                    className="bg-white"
                                                    onKeyPress={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault()
                                                            handleAddAmenity()
                                                        }
                                                    }}
                                                />
                                                <Button type="button" variant="outline" onClick={handleAddAmenity}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {formData.amenities.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {formData.amenities.map((amenity, index) => (
                                                        <Badge key={index} variant="secondary" className="flex items-center">
                                                            {amenity}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveAmenity(amenity)}
                                                                className="ml-1 hover:text-red-500"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-4">
                                            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                                                Cancel
                                            </Button>
                                            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                                                {isSubmitting ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        Create Stall Type
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {stallTypes.length === 0 && !isAddingType ? (
                                <div className="text-center py-12">
                                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-700">No stall types created yet</h3>
                                    <p className="text-gray-500 mb-6">Create your first stall type to get started</p>
                                    <Button onClick={() => setIsAddingType(true)} className="bg-blue-600 hover:bg-blue-700">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add First Stall Type
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {stallTypes.map((stallType) => (
                                        <Card key={stallType.typeId} className="border border-gray-200">
                                            {editingStallTypeId === stallType.typeId ? (
                                                <div className="p-6 space-y-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`editName-${stallType.typeId}`}>Stall Type Name *</Label>
                                                        <Input
                                                            id={`editName-${stallType.typeId}`}
                                                            name="name"
                                                            value={editFormData.name}
                                                            onChange={handleEditInputChange}
                                                            className="h-10"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`editLocation-${stallType.typeId}`}>Location</Label>
                                                        <Input
                                                            id={`editLocation-${stallType.typeId}`}
                                                            name="location"
                                                            value={editFormData.location}
                                                            onChange={handleEditInputChange}
                                                            className="h-10"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`editPricingType-${stallType.typeId}`}>Pricing Type *</Label>
                                                        <Select
                                                            value={pricingType}
                                                            onValueChange={(value: "Fixed Price" | "Rate per Area") => {
                                                                setPricingType(value)
                                                                if (value === "Fixed Price") {
                                                                    setEditFormData((prev) => ({ ...prev, sizeInSqFt: 1 }))
                                                                }
                                                            }}
                                                        >
                                                            <SelectTrigger id={`editPricingType-${stallType.typeId}`} className="h-10">
                                                                <SelectValue placeholder="Select pricing type" />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-white">
                                                                <SelectItem value="Fixed Price" className="hover:bg-gray-100">Fixed Price</SelectItem>
                                                                <SelectItem value="Rate per Area" className="hover:bg-gray-100">Rate per Area</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {pricingType === "Rate per Area" && (
                                                            <div className="space-y-2">
                                                                <Label htmlFor={`editSizeInSqFt-${stallType.typeId}`}>Size (sq ft) *</Label>
                                                                <Input
                                                                    id={`editSizeInSqFt-${stallType.typeId}`}
                                                                    name="sizeInSqFt"
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.1"
                                                                    value={editFormData.sizeInSqFt || ""}
                                                                    onChange={handleEditInputChange}
                                                                    className="h-10"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`editSize-${stallType.typeId}`}>Size Description *</Label>
                                                            <Input
                                                                id={`editSize-${stallType.typeId}`}
                                                                name="size"
                                                                value={editFormData.size}
                                                                onChange={handleEditInputChange}
                                                                className="h-10"
                                                                placeholder="e.g., 5ft x 5ft"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`editRate-${stallType.typeId}`}>
                                                                {pricingType === "Fixed Price" ? "Price *" : "Rate *"}
                                                            </Label>
                                                            <Input
                                                                id={`editRate-${stallType.typeId}`}
                                                                name="rate"
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={editFormData.rate || ""}
                                                                onChange={handleEditInputChange}
                                                                className="h-10"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor={`editUpcharge-${stallType.typeId}`}>Upcharge (Percentage)</Label>
                                                            <Input
                                                                id={`editUpcharge-${stallType.typeId}`}
                                                                name="upchargeInPercent"
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={editFormData.upchargeInPercent || ""}
                                                                onChange={handleEditInputChange}
                                                                className="h-10"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Amenities</Label>
                                                        <div className="flex space-x-2">
                                                            <Input
                                                                value={editNewAmenity}
                                                                onChange={(e) => setEditNewAmenity(e.target.value)}
                                                                placeholder="Add amenity"
                                                                className="h-10"
                                                                onKeyPress={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        e.preventDefault()
                                                                        handleEditAddAmenity()
                                                                    }
                                                                }}
                                                            />
                                                            <Button type="button" variant="outline" size="sm" onClick={handleEditAddAmenity}>
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        {editFormData.amenities.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {editFormData.amenities.map((amenity, index) => (
                                                                    <Badge key={index} variant="secondary" className="flex items-center text-xs">
                                                                        {amenity}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleEditRemoveAmenity(amenity)}
                                                                            className="ml-1 hover:text-red-500"
                                                                        >
                                                                            <X className="h-2 w-2" />
                                                                        </button>
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-end space-x-2 pt-2">
                                                        <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSubmitting}>
                                                            <X className="h-3 w-3 mr-1" />
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={handleUpdateSubmit}
                                                            disabled={isSubmitting}
                                                            className="bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            {isSubmitting ? (
                                                                <>
                                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                                                                    Saving...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Save className="h-3 w-3 mr-1" />
                                                                    Save
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <CardHeader className="pb-3">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <CardTitle className="text-lg">{stallType.name}</CardTitle>
                                                                {stallType.location && (
                                                                    <div className="flex items-center text-sm text-gray-600 mt-1">
                                                                        <MapPin className="h-3 w-3 mr-1" />
                                                                        {stallType.location}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex space-x-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleEdit(stallType)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDeleteClick(stallType)}
                                                                    className="h-8 w-8 text-red-500 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-3">
                                                            <div className="grid grid-cols-1 gap-2 text-sm">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center">
                                                                        <Ruler className="h-4 w-4 text-gray-400 mr-2" />
                                                                        <span>{stallType.size}</span>
                                                                    </div>
                                                                    {stallType.sizeInSqFt !== 1 && (
                                                                        <span className="text-xs text-gray-500">{formatSqFt(stallType.sizeInSqFt)}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <span className="font-medium text-green-600">
                                                                        {stallType.sizeInSqFt === 1
                                                                            ? `Price: ${formatCurrency(stallType.rate)}`
                                                                            : `Rate: ${formatCurrency(stallType.rate)}/sq ft`}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center">
                                                                    <span className="text-sm text-gray-600">
                                                                        Upcharge: {stallType.upchargeInPercent ? `${stallType.upchargeInPercent}%` : '0%'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {(stallType.amenities && stallType.amenities.length > 0) && (
                                                                <div>
                                                                    <div className="flex items-center text-sm text-gray-600 mb-2">
                                                                        <Star className="h-3 w-3 mr-1" />
                                                                        Amenities
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {(stallType.amenities || []).map((amenity, index) => (
                                                                            <Badge key={index} variant="outline" className="text-xs">
                                                                                {amenity}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Delete Stall Type</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{stallTypeToDelete?.name}"? This action cannot be undone and will also
                            delete all individual stalls of this type.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDeleteCancel} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Stall Type"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}