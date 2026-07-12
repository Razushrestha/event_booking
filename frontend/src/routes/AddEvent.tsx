"use client"

import { useState, useCallback } from "react"
import { Calendar, Clock, Home, ImageIcon, IndianRupee, Info, MapPin, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { notifyError, notifySuccess } from "@/components/toast"
import { AdminSidebar } from "@/components/Sidebar"
import formatCurrency from "@/components/utils/formatCurrency"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useNavigate } from "react-router-dom"
import { addEventByAdmin } from "@/services/eventServices"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import combineDateWithTime from "@/components/utils/combineDateWithTime"
import { useDropzone } from "react-dropzone"

interface TicketTier {
    name: string
    price: number | null
    listOfFeatures: string[]
}

interface EventFormData {
    title: string
    description: string
    location: string
    startDate: string
    endDate: string
    scheduleStart: string
    scheduleEnd: string
    ticketTiers: TicketTier[]
    poster: File | null
    ownEvent: boolean
    hasStalls: boolean
    registrationOpenDate: string
    registrationCloseDate: string
    minimumPaymentPercent: number
    entryType: 'paid' | 'free' | ''
    eventType: string
}

const acceptedFileTypes = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/svg+xml": [".svg"],
}

export default function CreateEventPage() {
    const navigate = useNavigate()
    const [currentTab, setCurrentTab] = useState(0)
    const [formData, setFormData] = useState<EventFormData>({
        title: "",
        description: "",
        location: "",
        startDate: "",
        endDate: "",
        scheduleStart: "",
        scheduleEnd: "",
        ticketTiers: [],
        poster: null,
        ownEvent: true,
        hasStalls: false,
        registrationOpenDate: "",
        registrationCloseDate: "",
        minimumPaymentPercent: 0,
        entryType: '',
        eventType: '',
    })
    const [newTier, setNewTier] = useState<TicketTier>({
        name: "",
        price: null,
        listOfFeatures: [""],
    })
    const [posterPreview, setPosterPreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        const file = acceptedFiles[0] // Only take the first file
        if (!Object.keys(acceptedFileTypes).includes(file.type)) {
            notifyError(`${file.name} is not a valid image file (JPG, PNG, GIF, SVG only)`)
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            notifyError(`${file.name} is too large (max 5MB)`)
            return
        }

        setFormData((prev) => ({ ...prev, poster: file }))
        const reader = new FileReader()
        reader.onload = (event) => {
            setPosterPreview(event.target?.result as string)
        }
        reader.readAsDataURL(file)
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: acceptedFileTypes,
        multiple: false,
        onDrop,
        disabled: isSubmitting,
    })

    // Helper function to combine date with fixed times
    const combineDateWithFixedTime = (date: string, isEnd: boolean): string => {
        if (!date) return ""
        return `${date}T${isEnd ? "23:59:59" : "00:00:00"}`
    }

    const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handleCheckboxChange = (name: keyof EventFormData) => {
        setFormData((prev) => ({
            ...prev,
            [name]: !prev[name],
            ...(name === "hasStalls" && !prev.hasStalls ? {} : {
                registrationOpenDate: "",
                registrationCloseDate: "",
                minimumPaymentPercent: 0,
            }),
        }))
    }

    const handleNewTierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setNewTier((prev) => ({
            ...prev,
            [name]: name === "price" ? (value ? Number.parseFloat(value) : null) : value,
        }))
    }

    const handleFeatureChange = (index: number, value: string) => {
        setNewTier((prev) => {
            const updatedFeatures = [...prev.listOfFeatures]
            updatedFeatures[index] = value
            return {
                ...prev,
                listOfFeatures: updatedFeatures,
            }
        })
    }

    const addFeature = () => {
        setNewTier((prev) => ({
            ...prev,
            listOfFeatures: [...prev.listOfFeatures, ""],
        }))
    }

    const removeFeature = (index: number) => {
        setNewTier((prev) => {
            const updatedFeatures = [...prev.listOfFeatures]
            updatedFeatures.splice(index, 1)
            return {
                ...prev,
                listOfFeatures: updatedFeatures,
            }
        })
    }

    const addTier = () => {
        if (!newTier.name.trim()) {
            notifyError("Ticket Category is required")
            return
        }
        if (newTier.price !== null && newTier.price < 0) {
            notifyError("Price must be 0 or more")
            return
        }
        const filteredFeatures = newTier.listOfFeatures.filter((feature) => feature.trim() !== "")
        setFormData((prev) => ({
            ...prev,
            ticketTiers: [
                ...prev.ticketTiers,
                { ...newTier, listOfFeatures: filteredFeatures },
            ],
        }))
        setNewTier({ name: "", price: null, listOfFeatures: [""] })
    }

    const removeTier = (index: number) => {
        setFormData((prev) => {
            const updatedTiers = [...prev.ticketTiers]
            updatedTiers.splice(index, 1)
            return { ...prev, ticketTiers: updatedTiers }
        })
    }

    const validateBasicInfo = () => {
        if (!formData.title.trim()) {
            notifyError("Event title is required")
            return false
        }
        if (!formData.description.trim()) {
            notifyError("Event description is required")
            return false
        }
        if (!formData.location.trim()) {
            notifyError("Event location is required")
            return false
        }
        if (!formData.startDate) {
            notifyError("Start date is required")
            return false
        }
        if (!formData.endDate) {
            notifyError("End date is required")
            return false
        }
        if (!formData.scheduleStart || !formData.scheduleEnd) {
            notifyError("Schedule start and end times are required")
            return false
        }
        if (!formData.entryType) {
            notifyError("Entry type is required")
            return false
        }
        const startDateTime = combineDateWithFixedTime(formData.startDate, false)
        const endDateTime = combineDateWithFixedTime(formData.endDate, true)
        if (new Date(endDateTime) <= new Date(startDateTime)) {
            notifyError("End date must be after start date")
            return false
        }
        // Validate time format (HH:mm)
        const timeFormat = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeFormat.test(formData.scheduleStart) || !timeFormat.test(formData.scheduleEnd)) {
            notifyError("Schedule times must be in HH:mm format")
            return false
        }
        return true
    }

    const validateTicketTiers = () => {
        if (!formData.ownEvent) return true
        if (formData.entryType === 'free') return true
        if (formData.ticketTiers.length === 0) {
            notifyError("At least one ticket category is required for paid events")
            return false
        }
        for (const tier of formData.ticketTiers) {
            if (!tier.name.trim()) {
                notifyError("All categories must have a name")
                return false
            }
            if (tier.price !== null && tier.price < 0) {
                notifyError("All categories must have a price 0 or greater")
                return false
            }
        }
        return true
    }

    const validateStallsRegistration = () => {
        if (!formData.hasStalls) return true
        if (!formData.registrationOpenDate) {
            notifyError("Registration open date is required")
            return false
        }
        if (!formData.registrationCloseDate) {
            notifyError("Registration close date is required")
            return false
        }
        const openDateTime = combineDateWithFixedTime(formData.registrationOpenDate, false)
        const closeDateTime = combineDateWithFixedTime(formData.registrationCloseDate, true)
        if (new Date(closeDateTime) <= new Date(openDateTime)) {
            notifyError("Registration close date must be after open date")
            return false
        }
        if (formData.minimumPaymentPercent < 0 || formData.minimumPaymentPercent > 100) {
            notifyError("Minimum payment percent must be between 0 and 100")
            return false
        }
        return true
    }

    const getTotalTabs = () => {
        if (!formData.ownEvent || formData.entryType === 'free') return 2
        return formData.hasStalls ? 4 : 3
    }

    const getNextTab = (current: number) => {
        if (!formData.ownEvent || formData.entryType === 'free') {
            return current === 0 ? 1 : current
        }
        if (!formData.hasStalls) {
            if (current === 1) return 2
            return current + 1
        }
        return current + 1
    }

    const getPrevTab = (current: number) => {
        if (!formData.ownEvent || formData.entryType === 'free') {
            return current === 1 ? 0 : current
        }
        if (!formData.hasStalls) {
            if (current === 2) return 1
            return current - 1
        }
        return current - 1
    }

    const handleNext = () => {
        if (currentTab === 0 && !validateBasicInfo()) return
        if (currentTab === 1 && !validateTicketTiers()) return
        if (currentTab === 3 && !validateStallsRegistration()) return
        setCurrentTab(getNextTab(currentTab))
    }

    const handlePrevious = () => {
        setCurrentTab(getPrevTab(currentTab))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateBasicInfo() || !validateTicketTiers() || !validateStallsRegistration()) return
        const formDataToSend = new FormData()
        setIsSubmitting(true)

        formDataToSend.append("title", formData.title)
        formDataToSend.append("description", formData.description)
        formDataToSend.append("location", formData.location)
        formDataToSend.append("ownEvent", formData.ownEvent.toString())
        formDataToSend.append("hasStalls", formData.hasStalls.toString())
        formDataToSend.append("entryType", formData.entryType)
        formDataToSend.append("eventType", formData.eventType)

        // Combine date with schedule times
        const startDateTime = combineDateWithTime(formData.startDate, formData.scheduleStart)
        const endDateTime = combineDateWithTime(formData.endDate, formData.scheduleEnd)

        formDataToSend.append("startDateTime", startDateTime)
        formDataToSend.append("endDateTime", endDateTime)
        formDataToSend.append("scheduleStart", formData.scheduleStart)
        formDataToSend.append("scheduleEnd", formData.scheduleEnd)

        if (formData.ownEvent) {
            const tiersToSend = formData.entryType === 'free'
                ? [{ name: "Free Entry", price: 0, listOfFeatures: [] }]
                : formData.ticketTiers
            formDataToSend.append("ticketTiers", JSON.stringify(tiersToSend))
        }

        if (formData.hasStalls) {
            const registrationOpen = combineDateWithFixedTime(formData.registrationOpenDate, false)
            const registrationClose = combineDateWithFixedTime(formData.registrationCloseDate, true)
            if (registrationOpen) formDataToSend.append("registrationOpen", registrationOpen)
            if (registrationClose) formDataToSend.append("registrationClose", registrationClose)
            formDataToSend.append("minimumPaymentPercent", formData.minimumPaymentPercent.toString())
        }

        if (formData.poster) {
            formDataToSend.append("poster", formData.poster)
        }

        try {
            const result = await addEventByAdmin(formDataToSend)
            if (result.success) {
                notifySuccess("Event created successfully")
                setTimeout(() => navigate("/dashboard"), 2000)
            } else {
                notifyError(result.message)
            }
        } catch (err) {
            notifyError("Failed to create event")
        } finally {
            setIsSubmitting(false)
        }
    }

    const totalTabs = getTotalTabs()
    const tabTitles = formData.ownEvent && formData.entryType !== 'free'
        ? ["Basic Information", "Ticket Categories", "Event Poster", ...(formData.hasStalls ? ["Stalls Registration"] : [])]
        : ["Basic Information", "Event Poster"]
    const tabDescriptions = formData.ownEvent && formData.entryType !== 'free'
        ? [
            "Enter the basic details of your event",
            "Create ticket categories with pricing and features",
            "Upload a poster image for your event",
            ...(formData.hasStalls ? ["Set registration details for stalls"] : []),
        ]
        : [
            "Enter the basic details of your event",
            "Upload a poster image for your event",
        ]

    return (
        <div className="flex h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Home className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-medium">Create New Event</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Admin User</span>
                        <Avatar>
                            <AvatarImage src="/placeholder.svg" alt="Admin" />
                            <AvatarFallback>AU</AvatarFallback>
                        </Avatar>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100">
                    <Card className="border-none bg-white shadow-lg max-w-4xl mx-auto">
                        <CardHeader>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex space-x-1">
                                    {Array.from({ length: totalTabs }).map((_, index) => (
                                        <div
                                            key={index}
                                            className={`rounded-full h-2 w-16 ${currentTab >= index ? "bg-blue-600" : "bg-gray-300"} transition-colors`}
                                        />
                                    ))}
                                </div>
                                <div className="text-sm text-gray-500">Step {currentTab + 1} of {totalTabs}</div>
                            </div>
                            <CardTitle>{tabTitles[currentTab]}</CardTitle>
                            <CardDescription>{tabDescriptions[currentTab]}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                {currentTab === 0 && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="title" className="flex items-center">
                                                <Info className="h-4 w-4 mr-1" />
                                                Event Title
                                            </Label>
                                            <Input
                                                id="title"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleBasicInfoChange}
                                                placeholder="e.g., Tech Conference 2025"
                                                className="h-11"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                name="description"
                                                value={formData.description}
                                                onChange={handleBasicInfoChange}
                                                placeholder="Describe your event..."
                                                className="min-h-[120px]"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="location" className="flex items-center">
                                                <MapPin className="h-4 w-4 mr-1" />
                                                Location
                                            </Label>
                                            <Input
                                                id="location"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleBasicInfoChange}
                                                placeholder="e.g., Convention Center, New York"
                                                className="h-11"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="entryType" className="flex items-center">
                                                {/* <span className="text-blue-500">Rs. </span> */}
                                                Entry Type
                                            </Label>
                                            <Select
                                                name="entryType"
                                                value={formData.entryType}
                                                onValueChange={(value) => {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        entryType: value as 'paid' | 'free',
                                                        ticketTiers: value === 'free' ? [{ name: "Free Entry", price: null, listOfFeatures: [] }] : prev.ticketTiers
                                                    }))
                                                }}
                                            >
                                                <SelectTrigger className="h-11">
                                                    <SelectValue placeholder="Select entry type" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border border-gray-300 rounded-md shadow-sm">
                                                    <SelectItem value="paid" className="hover:bg-gray-200">Paid</SelectItem>
                                                    <SelectItem value="free" className="hover:bg-gray-200">Free</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="eventType" className="flex items-center">
                                                <Info className="h-4 w-4 mr-1" />
                                                Event Type
                                            </Label>
                                            <Input
                                                id="eventType"
                                                name="eventType"
                                                type="text"
                                                value={formData.eventType}
                                                onChange={handleBasicInfoChange}
                                                placeholder="e.g., Conference, Workshop"
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    Start Date
                                                </Label>
                                                <Input
                                                    id="startDate"
                                                    name="startDate"
                                                    type="date"
                                                    value={formData.startDate}
                                                    onChange={handleBasicInfoChange}
                                                    className="h-11"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    End Date
                                                </Label>
                                                <Input
                                                    id="endDate"
                                                    name="endDate"
                                                    type="date"
                                                    value={formData.endDate}
                                                    onChange={handleBasicInfoChange}
                                                    className="h-11"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    Schedule Start Time (24-hour)
                                                </Label>
                                                <Input
                                                    id="scheduleStart"
                                                    name="scheduleStart"
                                                    type="time"
                                                    value={formData.scheduleStart}
                                                    onChange={handleBasicInfoChange}
                                                    className="h-11"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    Schedule End Time (24-hour)
                                                </Label>
                                                <Input
                                                    id="scheduleEnd"
                                                    name="scheduleEnd"
                                                    type="time"
                                                    value={formData.scheduleEnd}
                                                    onChange={handleBasicInfoChange}
                                                    className="h-11"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="ownEvent"
                                                    checked={formData.ownEvent}
                                                    onCheckedChange={() => handleCheckboxChange("ownEvent")}
                                                />
                                                <Label htmlFor="ownEvent">This event is managed by us</Label>
                                                <div className="ml-3">
                                                    <div
                                                        className={`max-w-xs p-3 rounded-md border text-sm ${
                                                            formData.ownEvent
                                                                ? "bg-green-50 border-green-200 text-green-800"
                                                                : "bg-yellow-50 border-yellow-200 text-yellow-800"
                                                        }`}
                                                    >
                                                        {formData.ownEvent ? (
                                                            <>
                                                                <div className="font-medium">Feature management enabled</div>
                                                                <div className="text-xs">Ticket management, stall management and other related features are active.</div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="font-medium">Enable advanced management</div>
                                                                <div className="text-xs">Toggle this on to enable ticket management, stall management and all related features.</div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="hasStalls"
                                                    checked={formData.hasStalls}
                                                    onCheckedChange={() => handleCheckboxChange("hasStalls")}
                                                />
                                                <Label htmlFor="hasStalls">Event includes stalls</Label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {currentTab === 1 && formData.ownEvent && formData.entryType === 'paid' && (
                                    <div className="space-y-6">
                                        {formData.ticketTiers.length > 0 && (
                                            <div className="space-y-4">
                                                <h3 className="font-medium text-gray-700">Ticket Categories</h3>
                                                <div className="space-y-3">
                                                    {formData.ticketTiers.map((tier, index) => (
                                                        <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <h4 className="font-medium">{tier.name || "Unnamed category"}</h4>
                                                                    <p className="text-blue-600 font-medium">{tier.price !== null ? formatCurrency(tier.price) : "Free"}</p>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeTier(index)}
                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                            {tier.listOfFeatures.length > 0 && (
                                                                <div className="mt-2">
                                                                    <h5 className="text-sm text-gray-500 mb-1">Features:</h5>
                                                                    <ul className="text-sm space-y-1">
                                                                        {tier.listOfFeatures.map((feature, fIndex) => (
                                                                            <li key={fIndex} className="flex items-center">
                                                                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2" />
                                                                                {feature}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="border-t pt-4">
                                            <h3 className="font-medium text-gray-700 mb-3">Add New Category</h3>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="tierName">Ticket Category</Label>
                                                        <Input
                                                            id="tierName"
                                                            name="name"
                                                            value={newTier.name}
                                                            onChange={handleNewTierChange}
                                                            placeholder="e.g., General Admission"
                                                            className="h-11"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="tierPrice" className="flex items-center">
                                                            <IndianRupee className="h-4 w-4 mr-1" />
                                                            Price
                                                        </Label>
                                                        <Input
                                                            id="tierPrice"
                                                            name="price"
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={newTier.price ?? ""}
                                                            onChange={handleNewTierChange}
                                                            placeholder="0.00"
                                                            className="h-11"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Label>Features (Optional)</Label>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={addFeature}
                                                            className="h-8 text-xs"
                                                        >
                                                            <Plus className="h-3 w-3 mr-1" />
                                                            Add Feature
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {newTier.listOfFeatures.map((feature, index) => (
                                                            <div key={index} className="flex items-center space-x-2">
                                                                <Input
                                                                    value={feature}
                                                                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                                                                    placeholder="e.g., Access to all sessions"
                                                                    className="h-10"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeFeature(index)}
                                                                    className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <Button type="button" onClick={addTier} className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Add Ticket Categories
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {((formData.ownEvent && (formData.entryType === 'free' ? currentTab === 1 : currentTab === 2)) || (!formData.ownEvent && currentTab === 1)) && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center">
                                                <ImageIcon className="h-4 w-4 mr-1" />
                                                Event Poster
                                            </Label>
                                            <div
                                                {...getRootProps()}
                                                className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 transition-colors
                                                    ${isDragActive ? "bg-gray-100 border-blue-500" : "hover:bg-gray-100"}
                                                    ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                            >
                                                <input {...getInputProps()} />
                                                {posterPreview ? (
                                                    <div className="space-y-4 w-full">
                                                        <div className="relative aspect-[3/2] w-full max-w-md mx-auto overflow-hidden rounded-lg">
                                                            <img
                                                                src={posterPreview || "/placeholder.png"}
                                                                alt="Event poster preview"
                                                                className="object-cover w-full h-full"
                                                            />
                                                        </div>
                                                        <div className="flex justify-center">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement | null)?.click()}
                                                                className="mr-2"
                                                                disabled={isSubmitting}
                                                            >
                                                                Change Image
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="text-red-500 border-red-500 hover:bg-red-50"
                                                                onClick={() => {
                                                                    setFormData((prev) => ({ ...prev, poster: null }))
                                                                    setPosterPreview(null)
                                                                }}
                                                                disabled={isSubmitting}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-4">
                                                        <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                                                        <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                                                        <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (Max. 5MB)</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {formData.ownEvent && formData.hasStalls && (formData.entryType === 'free' ? currentTab === 2 : currentTab === 3) && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                Registration Open Date
                                            </Label>
                                            <Input
                                                id="registrationOpenDate"
                                                name="registrationOpenDate"
                                                type="date"
                                                value={formData.registrationOpenDate}
                                                onChange={handleBasicInfoChange}
                                                className="h-11"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                Registration Close Date
                                            </Label>
                                            <Input
                                                id="registrationCloseDate"
                                                name="registrationCloseDate"
                                                type="date"
                                                value={formData.registrationCloseDate}
                                                onChange={handleBasicInfoChange}
                                                className="h-11"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="minimumPaymentPercent" className="flex items-center">
                                                <IndianRupee className="h-4 w-4 mr-1" />
                                                Minimum Payment Percent
                                            </Label>
                                            <Input
                                                id="minimumPaymentPercent"
                                                name="minimumPaymentPercent"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formData.minimumPaymentPercent || ""}
                                                onChange={(e) => setFormData((prev) => ({
                                                    ...prev,
                                                    minimumPaymentPercent: parseFloat(e.target.value) || 0,
                                                }))}
                                                placeholder="e.g., 50"
                                                className="h-11"
                                            />
                                        </div>
                                    </div>
                                )}
                            </form>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <div>
                                {currentTab > 0 && (
                                    <Button type="button" variant="outline" onClick={handlePrevious} disabled={isSubmitting}>
                                        Previous
                                    </Button>
                                )}
                            </div>
                            <div>
                                {currentTab < totalTabs - 1 ? (
                                    <Button type="button" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                                        Next
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isSubmitting ? "Creating Event..." : "Create Event"}
                                    </Button>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        </div>
    )
}