"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Store, Edit, Trash2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
import { getStallTypesByEventId, getStallsByEventId, createMultipleStallsWithType, deleteStallByStallId } from "@/services/stallSetupServices"
import { createStallWithType } from "@/services/stallSetupServices"

interface StallType {
    typeId?: string
    eventId?: string
    name: string
    sizeInSqFt: number
    stallTypeName: string
    size: string
    rate: number
    location: string
    amenities: string[]
    createdAt: string
}

interface Stall {
    _id: string
    stallId: string
    name: string
    stallTypeId: string
    stallTypeName: string
    eventId: string
    status: "hold" | "available" | "pending"
    createdAt: string
}

interface StallFormData {
    stallNames: string[]
    stallTypeId: string
}

interface EditStallFormData {
    name: string
    stallTypeId: string
}

interface StallsManagerProps {
    eventId: string
}

export function StallsManager({ eventId }: StallsManagerProps) {
    const [stallTypes, setStallTypes] = useState<StallType[]>([])
    const [activeStallType, setActiveStallType] = useState<string>()
    const [editStallType, setEditStallType] = useState<string>()
    const [stalls, setStalls] = useState<Stall[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAddingStall, setIsAddingStall] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [newStallName, setNewStallName] = useState("")
    const [editingStallId, setEditingStallId] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [stallToDelete, setStallToDelete] = useState<Stall | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const [formData, setFormData] = useState<StallFormData>({
        stallNames: [],
        stallTypeId: "",
    })

    const [editFormData, setEditFormData] = useState<EditStallFormData>({
        name: "",
        stallTypeId: "",
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const [stallTypesData, stallsData] = await Promise.all([getStallTypesByEventId(eventId), getStallsByEventId(eventId)])
                setStallTypes(stallTypesData)
                setStalls(Array.isArray(stallsData) ? stallsData : [])
            } catch (error) {
                console.error("Failed to fetch data:", error)
                notifyError("Failed to load stalls data")
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [eventId])

    const handleStallTypeChange = (value: string) => {
        console.log("Selected stall type:", value)
        setFormData((prev) => ({
            ...prev,
            stallTypeId: value,
        }))
        const selectedType = stallTypes.find((type) => type.typeId === value)
        setActiveStallType(selectedType ? selectedType.name : "")
    }

    const handleEditStallTypeChange = (value: string) => {
        setEditFormData((prev) => ({
            ...prev,
            stallTypeId: value,
        }))
        const selectedType = stallTypes.find((type) => type.typeId === value)
        setEditStallType(selectedType ? selectedType.name : "")
    }

    const handleAddStallName = () => {
        const trimmedName = newStallName.trim()
        if (!trimmedName) {
            notifyError("Stall name cannot be empty")
            return
        }
        if (formData.stallNames.includes(trimmedName)) {
            notifyError("This stall name is already added")
            return
        }
        if (stalls.some(stall => stall.name.toLowerCase() === trimmedName.toLowerCase())) {
            notifyError("A stall with this name already exists")
            return
        }
        setFormData((prev) => ({
            ...prev,
            stallNames: [...prev.stallNames, trimmedName],
        }))
        setNewStallName("")
    }

    const handleRemoveStallName = (name: string) => {
        setFormData((prev) => ({
            ...prev,
            stallNames: prev.stallNames.filter((n) => n !== name),
        }))
    }

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setEditFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleSubmit = async () => {
        if (formData.stallNames.length === 0) {
            notifyError("At least one stall name is required")
            return
        }

        if (!formData.stallTypeId) {
            notifyError("Please select a stall type")
            return
        }

        const selectedStallType = stallTypes.find((type) => type.typeId === formData.stallTypeId)
        if (!selectedStallType) {
            notifyError("Invalid stall type selected")
            return
        }

        // Check for duplicate stall names in existing stalls
        const duplicateNames = formData.stallNames.filter(name => 
            stalls.some(stall => stall.name.toLowerCase() === name.toLowerCase())
        )
        if (duplicateNames.length > 0) {
            notifyError(`The following stall names already exist: ${duplicateNames.join(", ")}`)
            return
        }

        setIsSubmitting(true)

        try {
            const newStallsResponse = await createMultipleStallsWithType(formData.stallTypeId, formData.stallNames)
            console.log(newStallsResponse)
            const selectedStallTypeName = String(activeStallType)
            const newStalls = (Array.isArray(newStallsResponse) ? newStallsResponse : [newStallsResponse]).map((stall) => ({
                _id: stall._id || stall.stallId || `temp-${Date.now()}`,
                stallId: stall.stallId || stall._id || `temp-${Date.now()}`,
                name: stall.name || formData.stallNames.find((name) => name === stall.name) || "",
                stallTypeId: stall.stallTypeId || formData.stallTypeId,
                stallTypeName: selectedStallTypeName,
                eventId: stall.eventId || eventId,
                status: stall.status || "available",
                createdAt: stall.createdAt || new Date().toISOString(),
            }))

            setStalls((prev) => [...prev, ...newStalls])
            setFormData({
                stallNames: [],
                stallTypeId: "",
            })
            setNewStallName("")
            setIsAddingStall(false)
            notifySuccess(`Created ${formData.stallNames.length} stall${formData.stallNames.length > 1 ? "s" : ""} successfully`)
        } catch (error) {
            console.error("Error in handleSubmit:", error)
            notifyError("Failed to create stalls. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = (stall: Stall) => {
        setEditFormData({
            name: stall.name,
            stallTypeId: stall.stallTypeId,
        })
        setEditingStallId(stall.stallId)
    }

    const handleEditSubmit = async () => {
        if (!editFormData.name.trim()) {
            notifyError("Stall name is required")
            return
        }

        if (!editFormData.stallTypeId) {
            notifyError("Please select a stall type")
            return
        }

        const selectedStallType = stallTypes.find((type) => type.typeId === editFormData.stallTypeId)
        if (!selectedStallType) {
            notifyError("Invalid stall type selected")
            return
        }

        // Check if the new name already exists (excluding the current stall being edited)
        if (stalls.some(stall => 
            stall.stallId !== editingStallId && 
            stall.name.toLowerCase() === editFormData.name.trim().toLowerCase()
        )) {
            notifyError("A stall with this name already exists")
            return
        }

        setIsSubmitting(true)

        try {
            const response = await createStallWithType(editFormData.stallTypeId, editFormData.name)
            console.log("Update stall response:", response)
            setStalls((prev) =>
                prev.map((s) =>
                    s.stallId === editingStallId
                        ? {
                            ...s,
                            name: editFormData.name,
                            stallTypeId: editFormData.stallTypeId,
                            stallTypeName: selectedStallType.stallTypeName,
                        }
                        : s
                )
            )
            setEditingStallId(null)
            setEditFormData({
                name: "",
                stallTypeId: "",
            })
            notifySuccess("Stall updated successfully")
        } catch (error) {
            console.error("Error in handleEditSubmit:", error)
            notifyError("Failed to update stall. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancelEdit = () => {
        setEditingStallId(null)
        setEditFormData({
            name: "",
            stallTypeId: "",
        })
    }

    const handleCancel = () => {
        setFormData({
            stallNames: [],
            stallTypeId: "",
        })
        setNewStallName("")
        setIsAddingStall(false)
    }

    const handleDeleteClick = (stall: Stall) => {
        setStallToDelete(stall)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!stallToDelete || !stallToDelete.stallId) return

        setIsDeleting(true)

        try {
            await deleteStallByStallId(stallToDelete.stallId)
            setStalls((prev) => prev.filter((s) => s.stallId !== stallToDelete.stallId))
            notifySuccess("Stall deleted successfully")
            setDeleteDialogOpen(false)
            setStallToDelete(null)
        } catch (error) {
            console.error("Error in handleDeleteConfirm:", error)
            notifyError("Failed to delete stall. Please try again.")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false)
        setStallToDelete(null)
    }

    const getStallTypeById = (stallTypeId: string) => {
        return stallTypes.find((type) => type.typeId === stallTypeId)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center">
                                <Store className="h-5 w-5 mr-2 text-blue-600" />
                                Individual Stalls
                            </CardTitle>
                            <CardDescription>Create specific stalls for each stall type</CardDescription>
                        </div>
                        {!isAddingStall && stallTypes.length > 0 && (
                            <Button onClick={() => setIsAddingStall(true)} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Stalls
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : stallTypes.length === 0 ? (
                        <div className="text-center py-12">
                            <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-700">No stall types available</h3>
                            <p className="text-gray-500">Please create stall types first before adding individual stalls</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {isAddingStall && (
                                <Card className="border-blue-200 bg-blue-50">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Add New Stalls</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="stallType">Stall Type *</Label>
                                            <Select value={formData.stallTypeId} onValueChange={handleStallTypeChange}>
                                                <SelectTrigger className="bg-white">
                                                    <SelectValue placeholder="Select stall type" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    {stallTypes.map((type) => (
                                                        <SelectItem key={type.typeId ?? ""} value={type.typeId ?? ""} className="hover:bg-gray-400">
                                                            <div className="flex items-center justify-between w-full">
                                                                <span>{type.name}</span>
                                                                <span className="text-sm text-gray-500 ml-2">{formatCurrency(type.rate)}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Stall Names *</Label>
                                            <div className="flex space-x-2">
                                                <Input
                                                    value={newStallName}
                                                    onChange={(e) => setNewStallName(e.target.value)}
                                                    placeholder="Add stall name (e.g., Stall A1, Food Corner 1)"
                                                    className="bg-white"
                                                    onKeyPress={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault()
                                                            handleAddStallName()
                                                        }
                                                    }}
                                                />
                                                <Button type="button" variant="outline" onClick={handleAddStallName}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {formData.stallNames.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {formData.stallNames.map((name, index) => (
                                                        <Badge key={index} variant="secondary" className="flex items-center">
                                                            {name}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveStallName(name)}
                                                                className="ml-1 hover:text-red-500"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {formData.stallTypeId && (
                                            <Card className="bg-white border-gray-200">
                                                <CardContent className="p-4">
                                                    {(() => {
                                                        const selectedType = getStallTypeById(formData.stallTypeId)
                                                        return selectedType ? (
                                                            <div className="space-y-2">
                                                                <h4 className="font-medium">Selected Stall Type Details:</h4>
                                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <span className="text-gray-500">Dimensions:</span>
                                                                        <span className="ml-2">{selectedType.size}</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-gray-500">Price:</span>
                                                                        <span className="ml-2 font-medium text-green-600">
                                                                            {formatCurrency(selectedType.sizeInSqFt === 1 ? selectedType.rate : selectedType.rate * selectedType.sizeInSqFt)}
                                                                        </span>
                                                                    </div>
                                                                    {selectedType.location && (
                                                                        <div>
                                                                            <span className="text-gray-500">Location:</span>
                                                                            <span className="ml-2">{selectedType.location}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {selectedType.amenities.length > 0 && (
                                                                    <div>
                                                                        <span className="text-gray-500 text-sm">Amenities:</span>
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {selectedType.amenities.map((amenity, index) => (
                                                                                <Badge key={index} variant="outline" className="text-xs">
                                                                                    {amenity}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : null
                                                    })()}
                                                </CardContent>
                                            </Card>
                                        )}

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
                                                        Create Stalls
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {stalls.length === 0 && !isAddingStall ? (
                                <div className="text-center py-12">
                                    <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-700">No stalls created yet</h3>
                                    <p className="text-gray-500 mb-6">Create your first stall to get started</p>
                                    <Button onClick={() => setIsAddingStall(true)} className="bg-blue-600 hover:bg-blue-700">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add First Stall
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-medium">Created Stalls ({stalls.length})</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                    <th className="px-4 py-3">Stall Name</th>
                                                    <th className="px-4 py-3">Type</th>
                                                    <th className="px-4 py-3">Status</th>
                                                    <th className="px-4 py-3">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {stalls.map((stall) => (
                                                    <tr key={stall.stallId} className="hover:bg-gray-50">
                                                        <td className="px-4 py-4 whitespace-nowrap font-medium">
                                                            {editingStallId === stall.stallId ? (
                                                                <Input
                                                                    name="name"
                                                                    value={editFormData.name}
                                                                    onChange={handleEditInputChange}
                                                                    placeholder="Stall name"
                                                                    className="h-8"
                                                                />
                                                            ) : (
                                                                stall.name
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            {editingStallId === stall.stallId ? (
                                                                <Select
                                                                    value={editFormData.stallTypeId}
                                                                    onValueChange={handleEditStallTypeChange}
                                                                >
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue placeholder="Select stall type" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {stallTypes.map((type) => (
                                                                            <SelectItem key={type.typeId ?? ""} value={type.typeId ?? ""}>
                                                                                {type.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            ) : (
                                                                <Badge variant="outline">{stall.stallTypeName || editStallType || "Unknown"}</Badge>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <Badge
                                                                className={
                                                                    stall.status === "available"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : stall.status === "pending"
                                                                            ? "bg-yellow-100 text-yellow-800"
                                                                            : stall.status === "hold"
                                                                                ? "bg-red-100 text-red-800"
                                                                                : stall.status === "booked"
                                                                                    ? "bg-blue-100 text-blue-800"
                                                                                    : ""
                                                                }
                                                            >
                                                                {stall.status === "available"
                                                                    ? "Available"
                                                                    : stall.status === "hold"
                                                                        ? "Hold"
                                                                        : stall.status === "pending"
                                                                            ? "Pending"
                                                                            : stall.status === "booked"
                                                                                ? "Booked"
                                                                                : stall.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            {editingStallId === stall.stallId ? (
                                                                <div className="flex space-x-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={handleCancelEdit}
                                                                        disabled={isSubmitting}
                                                                    >
                                                                        <X className="h-4 w-4 mr-1" />
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={handleEditSubmit}
                                                                        disabled={isSubmitting}
                                                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                                                    >
                                                                        <Save className="h-4 w-4 mr-1" />
                                                                        Save
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex space-x-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleEdit(stall)}
                                                                        disabled={stall.status !== "available" || isSubmitting}
                                                                    >
                                                                        <Edit className="h-4 w-4 mr-1" />
                                                                        Edit
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteClick(stall)}
                                                                        disabled={stall.status !== "available" || isSubmitting}
                                                                        className="text-red-500 hover:text-red-700"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                                        Delete
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Stall</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{stallToDelete?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDeleteCancel} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Stall"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}