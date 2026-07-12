"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Clock, User, X, Building } from "lucide-react"
import { notifyError } from "../toast"
import useAuthStore from "@/store/authStore"
import type { Stall } from "@/interface/Stalls"
import { getStallByStallId } from "@/services/stallBookingServices"
import StallInvoiceTable from "./StallInvoiceTable"
import { holdStallByOrganizer } from "@/services/stallBookingServices"

interface HoldStallDialogProps {
    isOpen: boolean
    onClose: () => void
    selectedStalls: string[]
    stallsData: Stall[]
    onSuccess: () => void
    onStallToggle: (stallId: string) => void
}

interface HoldFormData {
    businessName: string
    businessPhone: string
    businessEmail: string
    contactPersonName: string
    contactPersonNumber: string
    contactPersonEmail: string
}

interface StallDetailData {
    _id: string
    eventId: string
    name: string
    expiryDate: string | null
    status: string
    images: string[]
    stallId: string
    createdAt: string
    updatedAt: string
    stallTypeName: string
    sizeInSqFt: number
    size: string
    rate: number
    location: string
    amenities: string[]
    upchargeInPercent?: number
}

export default function HoldStallDialog({
    isOpen,
    onClose,
    selectedStalls,
    stallsData,
    onSuccess,
    onStallToggle,
}: HoldStallDialogProps) {
    const { user } = useAuthStore()
    const [formData, setFormData] = useState<HoldFormData>({
        businessName: "",
        businessPhone: "",
        businessEmail: "",
        contactPersonName: "",
        contactPersonNumber: "",
        contactPersonEmail: "",
    })
    const [stallDetails, setStallDetails] = useState<StallDetailData[]>([])
    const [isLoadingStallDetails, setIsLoadingStallDetails] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const selectedStallDetails = stallsData.filter((stall) => selectedStalls.includes(stall.stallId))

    useEffect(() => {
        if (isOpen) {
            loadStallDetails()

            // Set default values from user data
            if (user) {
                setFormData((prev) => ({
                    ...prev,
                    businessName: user.name || "",
                    businessPhone: user.number || "",
                    businessEmail: user.email || "",
                    contactPersonName: user.contactPersonName || "",
                    contactPersonNumber: user.contactPersonNumber || "",
                    contactPersonEmail: user.contactPersonEmail || "",
                }))
            }
        }
    }, [isOpen, selectedStalls, user])

    const loadStallDetails = async () => {
        if (selectedStalls.length === 0) return

        setIsLoadingStallDetails(true)
        try {
            const details = await getStallByStallId(selectedStalls)
            // Ensure we always have an array
            const detailsArray = Array.isArray(details) ? details : [details]
            setStallDetails(detailsArray)
        } catch (error) {
            notifyError("Failed to load stall details")
            setStallDetails([])
        } finally {
            setIsLoadingStallDetails(false)
        }
    }

    const handleInputChange = (field: keyof HoldFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (
            !formData.businessName.trim() ||
            !formData.businessPhone.trim() ||
            !formData.businessEmail.trim() ||
            !formData.contactPersonName.trim() ||
            !formData.contactPersonNumber.trim() ||
            !formData.contactPersonEmail.trim()
        ) {
            notifyError("Please fill in all required fields")
            return
        }

        if (selectedStalls.length === 0) {
            notifyError("Please select at least one stall")
            return
        }

        setIsSubmitting(true)

        try {
            const holdData = {
                stallIds: selectedStalls,
                businessName: formData.businessName,
                businessPhone: formData.businessPhone,
                businessEmail: formData.businessEmail,
                contactPersonName: formData.contactPersonName,
                contactPersonNumber: formData.contactPersonNumber,
                contactPersonEmail: formData.contactPersonEmail,
            }

            console.log(selectedStalls)
            await holdStallByOrganizer(holdData)

            console.log("Holding stalls:", holdData)

            onSuccess()
            setFormData({
                businessName: "",
                businessPhone: "",
                businessEmail: "",
                contactPersonName: "",
                contactPersonNumber: "",
                contactPersonEmail: "",
            })
            setStallDetails([])
        } catch (error) {
            notifyError("Failed to hold stalls. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl">
                <DialogHeader className="pb-6">
                    <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                            <Clock className="h-5 w-5 text-white" />
                        </div>
                        Hold Selected Stalls
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Selected Stalls Section */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-sm text-gray-900">Selected Stalls ({selectedStalls.length})</h4>
                            {selectedStalls.length > 0 && <span className="text-xs text-gray-600">Click × to remove stalls</span>}
                        </div>

                        {selectedStalls.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                                {selectedStallDetails.map((stall) => (
                                    <div
                                        key={stall.stallId}
                                        className="flex items-center justify-between p-3 bg-yellow-100 border border-yellow-300 rounded-lg group hover:bg-yellow-200 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">{stall.name}</span>
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 text-sm">{stall.name}</div>
                                                <div className="text-xs text-gray-600">{stall.stallTypeName}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onStallToggle(stall.stallId)}
                                            className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove stall"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-sm">No stalls selected</p>
                                <p className="text-gray-400 text-xs mt-1">Please select stalls from the grid to continue</p>
                            </div>
                        )}
                    </div>

                    {/* Invoice Table */}
                    {stallDetails.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <h4 className="font-bold text-gray-900 mb-4">Stall Details</h4>
                            {isLoadingStallDetails ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
                                    <span className="ml-3 text-gray-600">Loading stall details...</span>
                                </div>
                            ) : (
                                <StallInvoiceTable stallsData={stallDetails} />
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Organization Details */}
                        <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                Organization Details
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="organizationName" className="text-sm font-semibold text-gray-700">
                                        Organization Name *
                                    </Label>
                                    <Input
                                        id="organizationName"
                                        type="text"
                                        value={formData.businessName}
                                        onChange={(e) => handleInputChange("businessName", e.target.value)}
                                        placeholder="Enter organization name"
                                        className="h-12 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 bg-white"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="organizationNumber" className="text-sm font-semibold text-gray-700">
                                        Organization Number *
                                    </Label>
                                    <Input
                                        id="organizationNumber"
                                        type="tel"
                                        value={formData.businessPhone}
                                        onChange={(e) => handleInputChange("businessPhone", e.target.value)}
                                        placeholder="Enter organization number"
                                        className="h-12 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 bg-white"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="organizationEmail" className="text-sm font-semibold text-gray-700">
                                        Organization Email *
                                    </Label>
                                    <Input
                                        id="organizationEmail"
                                        type="email"
                                        value={formData.businessEmail}
                                        onChange={(e) => handleInputChange("businessEmail", e.target.value)}
                                        placeholder="Enter organization email"
                                        className="h-12 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 bg-white"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Person Details */}
                        <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Contact Person Details
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contactPersonName" className="text-sm font-semibold text-gray-700">
                                        Contact Person Name *
                                    </Label>
                                    <Input
                                        id="contactPersonName"
                                        type="text"
                                        value={formData.contactPersonName}
                                        onChange={(e) => handleInputChange("contactPersonName", e.target.value)}
                                        placeholder="Enter contact person name"
                                        className="h-12 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 bg-white"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contactPersonNumber" className="text-sm font-semibold text-gray-700">
                                        Contact Person Number *
                                    </Label>
                                    <Input
                                        id="contactPersonNumber"
                                        type="tel"
                                        value={formData.contactPersonNumber}
                                        onChange={(e) => handleInputChange("contactPersonNumber", e.target.value)}
                                        placeholder="Enter contact person number"
                                        className="h-12 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 bg-white"
                                        required
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="contactPersonEmail" className="text-sm font-semibold text-gray-700">
                                        Contact Person Email *
                                    </Label>
                                    <Input
                                        id="contactPersonEmail"
                                        type="email"
                                        value={formData.contactPersonEmail}
                                        onChange={(e) => handleInputChange("contactPersonEmail", e.target.value)}
                                        placeholder="Enter contact person email"
                                        className="h-12 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 bg-white"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-lg"
                                disabled={isSubmitting || selectedStalls.length === 0}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Holding...
                                    </>
                                ) : (
                                    `Hold ${selectedStalls.length} Stall${selectedStalls.length !== 1 ? "s" : ""}`
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
