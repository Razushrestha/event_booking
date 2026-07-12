import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Calendar, Clock, Home, ImageIcon, Info, MapPin, Plus, Trash2, Percent, X, Map, Link, User, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { notifyError, notifySuccess } from "@/components/toast"
import { AdminSidebar } from "@/components/Sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useNavigate, useParams } from "react-router-dom"
import { addEventByAdmin, getEventById, updateEventByAdmin } from "@/services/eventServices"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import combineDateWithTime from "@/components/utils/combineDateWithTime"
import { useDropzone } from "react-dropzone"
import formatCurrency from "@/components/utils/formatCurrency"

interface TicketTier {
    name: string
    price: number | null
    listOfFeatures: string[]
}

interface FormData {
    title: string
    description: string
    location: string
    googleMapUrl: string
    organizer: string
    organizerLogo: File | null
    managedBy: string
    managedByLogo: File | null
    startDate: string
    endDate: string
    scheduleStart: string
    scheduleEnd: string
    ticketTiers: TicketTier[]
    poster: File | null
    ownEvent: boolean
    hasStalls: boolean
    registrationOpen: string
    registrationClose: string
    ticketNeedsAttendeeImage: boolean
    minimumPaymentPercent: number
    entryType: 'paid' | 'free' | ''
    eventType: string
    externalLink: string
}

const acceptedFileTypes = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/svg+xml": [".svg"],
}

export default function CreateEditEventFormData() {
    const navigate = useNavigate()
    const { eventId } = useParams<{ eventId: string }>()
    const [currentTab, setCurrentTab] = useState(0)
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<FormData>({
        title: "",
        description: "",
        location: "",
        googleMapUrl: "",
        organizer: "",
        organizerLogo: null,
        managedBy: "",
        managedByLogo: null,
        startDate: "",
        endDate: "",
        scheduleStart: "",
        scheduleEnd: "",
        ticketTiers: [],
        poster: null,
        ownEvent: true,
        hasStalls: false,
        registrationOpen: "",
        registrationClose: "",
        minimumPaymentPercent: 0,
        ticketNeedsAttendeeImage: false,
        entryType: '',
        eventType: '',
        externalLink: '',
    })
    const [newTier, setNewTier] = useState<TicketTier>({
        name: "",
        price: null,
        listOfFeatures: [""],
    })
    const [posterPreview, setPosterPreview] = useState<string | null>(null)
    const [organizerLogoPreview, setOrganizerLogoPreview] = useState<string | null>(null)
    const [managedByLogoPreview, setManagedByLogoPreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (eventId) {
            setIsEditing(true)
            fetchEventData(eventId)
        }
    }, [eventId])

    const fetchEventData = async (id: string) => {
        setIsLoading(true)
        try {
            const event = await getEventById(id)
            if (event) {
                setFormData({
                    title: event.title,
                    description: event.description,
                    location: event.location,
                    googleMapUrl: event.googleMapUrl || "",
                    organizer: event.organizer || "",
                    organizerLogo: null,
                    managedBy: event.managedBy || "",
                    managedByLogo: null,
                    startDate: event.startDateTime ? new Date(event.startDateTime).toISOString().split('T')[0] : "",
                    endDate: event.endDateTime ? new Date(event.endDateTime).toISOString().split('T')[0] : "",
                    scheduleStart: event.scheduleStart || "",
                    scheduleEnd: event.scheduleEnd || "",
                    ticketTiers: event.ticketTiers || [],
                    poster: null,
                    ownEvent: event.ownEvent ?? true,
                    hasStalls: event.hasStalls ?? false,
                    registrationOpen: event.registrationOpen ? new Date(event.registrationOpen).toISOString().split('T')[0] : "",
                    registrationClose: event.registrationClose ? new Date(event.registrationClose).toISOString().split('T')[0] : "",
                    minimumPaymentPercent: event.minimumPaymentPercent ?? 0,
                    entryType: event.entryType || '',
                    eventType: event.eventType || '',
                    externalLink: event.externalLink || '',
                    ticketNeedsAttendeeImage: event.ticketNeedsAttendeeImage || false,
                })
                if (event.poster) {
                    setPosterPreview(`${import.meta.env.VITE_IMAGE_URL}${event.poster}`)
                }
                if (event.organizerLogo) {
                    setOrganizerLogoPreview(`${import.meta.env.VITE_IMAGE_URL}${event.organizerLogo}`)
                }
                if (event.managedByLogo) {
                    setManagedByLogoPreview(`${import.meta.env.VITE_IMAGE_URL}${event.managedByLogo}`)
                }
            } else {
                notifyError("Event not found")
                navigate("/admin/events")
            }
        } catch (error) {
            console.error("Error fetching event:", error)
            notifyError("Failed to load event data")
            navigate("/admin/events")
        } finally {
            setIsLoading(false)
        }
    }

    const onDropPoster = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        const file = acceptedFiles[0]
        if (!Object.keys(acceptedFileTypes).includes(file.type)) {
            notifyError(`${file.name} is not a valid image file (JPG, PNG, GIF, SVG only)`)
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            notifyError(`${file.name} is too large (max 5MB)`)
            return
        }

        let finalFile = file
        setFormData((prev) => ({ ...prev, poster: finalFile }))
        const reader = new FileReader()
        reader.onload = (event) => {
            setPosterPreview(event.target?.result as string)
        }
        reader.readAsDataURL(finalFile)
    }, [])

    const onDropOrganizerLogo = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        const file = acceptedFiles[0]
        if (!Object.keys(acceptedFileTypes).includes(file.type)) {
            notifyError(`${file.name} is not a valid image file (JPG, PNG, GIF, SVG only)`)
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            notifyError(`${file.name} is too large (max 5MB)`)
            return
        }

        let finalFile = file

        setFormData((prev) => ({ ...prev, organizerLogo: finalFile }))
        const reader = new FileReader()
        reader.onload = (event) => {
            setOrganizerLogoPreview(event.target?.result as string)
        }
        reader.readAsDataURL(finalFile)
    }, [])

    const onDropManagedByLogo = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return

        const file = acceptedFiles[0]
        if (!Object.keys(acceptedFileTypes).includes(file.type)) {
            notifyError(`${file.name} is not a valid image file (JPG, PNG, GIF, SVG only)`)
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            notifyError(`${file.name} is too large (max 5MB)`)
            return
        }

        let finalFile = file


        setFormData((prev) => ({ ...prev, managedByLogo: finalFile }))
        const reader = new FileReader()
        reader.onload = (event) => {
            setManagedByLogoPreview(event.target?.result as string)
        }
        reader.readAsDataURL(finalFile)
    }, [])

    const { getRootProps: getPosterRootProps, getInputProps: getPosterInputProps, isDragActive: isPosterDragActive } = useDropzone({
        accept: acceptedFileTypes,
        multiple: false,
        onDrop: onDropPoster,
        disabled: isSubmitting,
    })

    const { getRootProps: getOrganizerLogoRootProps, getInputProps: getOrganizerLogoInputProps, isDragActive: isOrganizerLogoDragActive } = useDropzone({
        accept: acceptedFileTypes,
        multiple: false,
        onDrop: onDropOrganizerLogo,
        disabled: isSubmitting,
    })

    const { getRootProps: getManagedByLogoRootProps, getInputProps: getManagedByLogoInputProps, isDragActive: isManagedByLogoDragActive } = useDropzone({
        accept: acceptedFileTypes,
        multiple: false,
        onDrop: onDropManagedByLogo,
        disabled: isSubmitting,
    })

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

    const handleCheckboxChange = (name: keyof FormData) => {
        setFormData((prev) => ({
            ...prev,
            [name]: !prev[name],
            ...(name === "ownEvent" && prev.ownEvent ? {
                hasStalls: false,
                registrationOpen: "",
                registrationClose: "",
                minimumPaymentPercent: 0,
            } : {}),
            ...(name === "hasStalls" && prev.hasStalls ? {
                registrationOpen: "",
                registrationClose: "",
                minimumPaymentPercent: 0,
            } : {}),
        }))
    }

    const handleTicketNeedsAttendeeImageChange = () => {
        setFormData((prev) => ({
            ...prev,
            ticketNeedsAttendeeImage: !prev.ticketNeedsAttendeeImage,
        }))
        console.log(formData.ticketNeedsAttendeeImage)
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
            return { ...prev, listOfFeatures: updatedFeatures }
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
            return { ...prev, listOfFeatures: updatedFeatures }
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
        if (!formData.ownEvent || !formData.hasStalls) return true
        if (!formData.registrationOpen) {
            notifyError("Registration open date is required")
            return false
        }
        if (!formData.registrationClose) {
            notifyError("Registration close date is required")
            return false
        }
        const openDateTime = combineDateWithFixedTime(formData.registrationOpen, false)
        const closeDateTime = combineDateWithFixedTime(formData.registrationClose, true)
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
        if (!formData.ownEvent) return 2
        if (!formData.hasStalls) return formData.entryType === 'free' ? 2 : 3
        return formData.entryType === 'free' ? 3 : 4
    }

    const getNextTab = (current: number) => {
        if (!formData.ownEvent) {
            return current === 0 ? 1 : current
        }
        if (formData.entryType === 'free') {
            if (!formData.hasStalls) return current === 0 ? 1 : current
            if (current === 0) return 1
            if (current === 1) return 2
            return current
        }
        if (!formData.hasStalls) {
            if (current === 0) return 1
            if (current === 1) return 2
            return current
        }
        return current + 1
    }

    const getPrevTab = (current: number) => {
        if (!formData.ownEvent) {
            return current === 1 ? 0 : current
        }
        if (formData.entryType === 'free') {
            if (!formData.hasStalls) return current === 1 ? 0 : current
            if (current === 2) return 1
            if (current === 1) return 0
            return current
        }
        if (!formData.hasStalls) {
            if (current === 2) return 1
            if (current === 1) return 0
            return current
        }
        return current - 1
    }

    const handleNext = () => {
        if (currentTab === 0 && !validateBasicInfo()) return
        if (currentTab === 1 && !validateTicketTiers()) return
        if (formData.hasStalls && (formData.entryType === 'free' ? currentTab === 2 : currentTab === 3) && !validateStallsRegistration()) return
        setCurrentTab(getNextTab(currentTab))
    }

    const handlePrevious = () => {
        setCurrentTab(getPrevTab(currentTab))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log(formData.ticketNeedsAttendeeImage)
        if (!validateBasicInfo() || !validateTicketTiers() || !validateStallsRegistration()) return
        const formDataToSend = new FormData()
        setIsSubmitting(true)

        formDataToSend.append("title", formData.title)
        formDataToSend.append("description", formData.description)
        formDataToSend.append("location", formData.location)
        formDataToSend.append("googleMapUrl", formData.googleMapUrl)
        formDataToSend.append("organizer", formData.organizer)
        formDataToSend.append("managedBy", formData.managedBy)
        formDataToSend.append("externalLink", formData.externalLink)
        formDataToSend.append("startDateTime", combineDateWithTime(formData.startDate, formData.scheduleStart))
        formDataToSend.append("endDateTime", combineDateWithTime(formData.endDate, formData.scheduleEnd))
        formDataToSend.append("scheduleStart", formData.scheduleStart)
        formDataToSend.append("scheduleEnd", formData.scheduleEnd)
        formDataToSend.append("ownEvent", formData.ownEvent.toString())
        formDataToSend.append("hasStalls", formData.hasStalls.toString())
        formDataToSend.append("eventType", formData.eventType)
        formDataToSend.append("entryType", formData.entryType)
        formDataToSend.append("ticketNeedsAttendeeImage", formData.ticketNeedsAttendeeImage.toString())
        if (formData.ownEvent) {
            const tiersToSend = formData.entryType === 'free'
                ? [{ name: "Free Entry", price: null, listOfFeatures: [] }]
                : formData.ticketTiers
            formDataToSend.append("ticketTiers", JSON.stringify(tiersToSend))
        }

        if (formData.hasStalls) {
            const registrationOpen = combineDateWithFixedTime(formData.registrationOpen, false)
            const registrationClose = combineDateWithFixedTime(formData.registrationClose, true)
            if (registrationOpen) formDataToSend.append("registrationOpen", registrationOpen)
            if (registrationClose) formDataToSend.append("registrationClose", registrationClose)
            formDataToSend.append("minimumPaymentPercent", formData.minimumPaymentPercent.toString())
        }

        if (formData.poster) {
            formDataToSend.append("poster", formData.poster)
        }
        if (formData.organizerLogo) {
            formDataToSend.append("organizerLogo", formData.organizerLogo)
        }
        if (formData.managedByLogo) {
            formDataToSend.append("managedByLogo", formData.managedByLogo)
        }

        if (isEditing && eventId) {
            formDataToSend.append("eventId", eventId)
        }

        try {
            console.log("Submitting form data:", Object.fromEntries(formDataToSend.entries()))
            const result = isEditing && eventId ? await updateEventByAdmin(formDataToSend) : await addEventByAdmin(formDataToSend)
            if (result.success) {
                notifySuccess(isEditing ? "Event updated successfully" : "Event created successfully")
                navigate("/admin/events")
            } else {
                notifyError(result.message)
            }
        } catch (err) {
            notifyError(isEditing ? "Failed to update event" : "Failed to create event")
        } finally {
            setIsSubmitting(false)
        }
    }


    const totalTabs = getTotalTabs()
    const tabTitles = formData.ownEvent
        ? formData.entryType === 'free'
            ? ['Basic Information', 'Event Poster', ...(formData.hasStalls ? ['Stalls Registration'] : [])]
            : ['Basic Information', 'Ticket Categories', 'Event Poster', ...(formData.hasStalls ? ['Stalls Registration'] : [])]
        : ['Basic Information', 'Event Poster']

    const tabDescriptions = formData.ownEvent
        ? formData.entryType === 'free'
            ? [
                isEditing ? 'Edit the basic details of your event' : 'Enter the basic details of your event',
                isEditing ? 'Update the poster image for your event' : 'Upload a poster image for your event',
                ...(formData.hasStalls
                    ? [isEditing ? 'Edit registration details for stalls' : 'Set registration details for stalls']
                    : []),
            ]
            : [
                isEditing ? 'Edit the basic details of your event' : 'Enter the basic details of your event',
                isEditing ? 'Edit ticket categories with pricing and features' : 'Create ticket categories with pricing and features',
                isEditing ? 'Update the poster image for your event' : 'Upload a poster image for your event',
                ...(formData.hasStalls
                    ? [isEditing ? 'Edit registration details for stalls' : 'Set registration details for stalls']
                    : []),
            ]
        : [
            isEditing ? 'Edit the basic details of your event' : 'Enter the basic details of your event',
            isEditing ? 'Update the poster image for your event' : 'Upload a poster image for your event',
        ]

    if (isLoading) {
        return (
            <div className="flex h-screen bg-gray-50">
                <AdminSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
                        <div className="flex items-center">
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Home className="h-5 w-5" />
                            </Button>
                            <h2 className="text-lg font-medium">Loading Event...</h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Admin User</span>
                            <Avatar>
                                <AvatarFallback>AU</AvatarFallback>
                            </Avatar>
                        </div>
                    </header>
                    <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading event data...</p>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Home className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-medium">{isEditing ? "Edit Event" : "Create New Event"}</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Admin User</span>
                        <Avatar>
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
                                            <Label htmlFor="googleMapUrl" className="flex items-center">
                                                <Map className="h-4 w-4 mr-1" />
                                                Google Map URL
                                            </Label>
                                            <Input
                                                id="googleMapUrl"
                                                name="googleMapUrl"
                                                value={formData.googleMapUrl}
                                                onChange={handleBasicInfoChange}
                                                placeholder="e.g., https://maps.google.com/..."
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="organizer" className="flex items-center">
                                                <User className="h-4 w-4 mr-1" />
                                                Organizer
                                            </Label>
                                            <Input
                                                id="organizer"
                                                name="organizer"
                                                value={formData.organizer}
                                                onChange={handleBasicInfoChange}
                                                placeholder="e.g., Tech Events Inc."
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center">
                                                <Image className="h-4 w-4 mr-1" />
                                                Organizer Logo
                                                {isEditing && !formData.organizerLogo && organizerLogoPreview && (
                                                    <span className="ml-2 text-sm text-gray-500">(Current logo shown)</span>
                                                )}
                                            </Label>
                                            <div
                                                {...getOrganizerLogoRootProps()}
                                                className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 transition-colors
                                                    ${isOrganizerLogoDragActive ? "bg-gray-100 border-blue-500" : "hover:bg-gray-100"}
                                                    ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                            >
                                                <input {...getOrganizerLogoInputProps()} />
                                                {organizerLogoPreview ? (
                                                    <div className="space-y-4 w-full">
                                                        <div className="relative aspect-square w-full max-w-[200px] mx-auto overflow-hidden rounded-lg">
                                                            <img
                                                                src={organizerLogoPreview}
                                                                alt="Organizer logo preview"
                                                                className="object-cover w-full h-full"
                                                            />
                                                        </div>
                                                        <div className="flex justify-center">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => (document.querySelector('input[type="file"][name="organizerLogo"]') as HTMLInputElement | null)?.click()}
                                                                className="mr-2"
                                                                disabled={isSubmitting}
                                                            >
                                                                Change Logo
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="text-red-500 border-red-500 hover:bg-red-50"
                                                                onClick={() => {
                                                                    setFormData((prev) => ({ ...prev, organizerLogo: null }))
                                                                    setOrganizerLogoPreview(null)
                                                                }}
                                                                disabled={isSubmitting}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                        <div className="flex justify-center mt-2">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                                                                <Image className="h-4 w-4 mr-1 text-blue-500" />
                                                                Recommended Logo Size: <span className="ml-1 font-bold">200x200 </span> pixels
                                                            </span>
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-semibold border border-yellow-200 shadow-sm ml-2">
                                                                Max file size: <span className="ml-1 font-bold">2MB</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-4">
                                                        <Image className="h-12 w-12 text-gray-400 mb-2" />
                                                        <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                                                        <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (Max. 5MB)</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="externalLink" className="flex items-center">
                                                <Link className="h-4 w-4 mr-1" />
                                                External Link (Optional)
                                            </Label>
                                            <Input
                                                id="externalLink"
                                                name="externalLink"
                                                type="url"
                                                value={formData.externalLink}
                                                onChange={handleBasicInfoChange}
                                                placeholder="e.g., https://example.com/tickets"
                                                className="h-11"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="managedBy" className="flex items-center">
                                                <User className="h-4 w-4 mr-1" />
                                                Managed By (Optional)
                                            </Label>
                                            <Input
                                                id="managedBy"
                                                name="managedBy"
                                                value={formData.managedBy}
                                                onChange={handleBasicInfoChange}
                                                placeholder="e.g., Event Management Co."
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center">
                                                <Image className="h-4 w-4 mr-1" />
                                                Managed By Logo (Optional)
                                                {isEditing && !formData.managedByLogo && managedByLogoPreview && (
                                                    <span className="ml-2 text-sm text-gray-500">(Current logo shown)</span>
                                                )}
                                            </Label>
                                            <div
                                                {...getManagedByLogoRootProps()}
                                                className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 transition-colors
                                                    ${isManagedByLogoDragActive ? "bg-gray-100 border-blue-500" : "hover:bg-gray-100"}
                                                    ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                            >
                                                <input {...getManagedByLogoInputProps()} />
                                                {managedByLogoPreview ? (
                                                    <div className="space-y-4 w-full">
                                                        <div className="relative aspect-square w-full max-w-[200px] mx-auto overflow-hidden rounded-lg">
                                                            <img
                                                                src={managedByLogoPreview}
                                                                alt="Managed by logo preview"
                                                                className="object-cover w-full h-full"
                                                            />
                                                        </div>
                                                        <div className="flex justify-center">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => (document.querySelector('input[type="file"][name="managedByLogo"]') as HTMLInputElement | null)?.click()}
                                                                className="mr-2"
                                                                disabled={isSubmitting}
                                                            >
                                                                Change Logo
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                className="text-red-500 border-red-500 hover:bg-red-50"
                                                                onClick={() => {
                                                                    setFormData((prev) => ({ ...prev, managedByLogo: null }))
                                                                    setManagedByLogoPreview(null)
                                                                }}
                                                                disabled={isSubmitting}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                        <div className="flex justify-center mt-2">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                                                                <Image className="h-4 w-4 mr-1 text-blue-500" />
                                                                Recommended Logo Size: <span className="ml-1 font-bold">200x200 </span> pixels
                                                            </span>
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-semibold border border-yellow-200 shadow-sm ml-2">
                                                                Max file size: <span className="ml-1 font-bold">2MB</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-4">
                                                        <Image className="h-12 w-12 text-gray-400 mb-2" />
                                                        <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                                                        <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or GIF (Max. 5MB)</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="entryType" className="flex items-center">
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="startDate" className="flex items-center">
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
                                                <Label htmlFor="endDate" className="flex items-center">
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
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="scheduleStart" className="flex items-center">
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
                                                <Label htmlFor="scheduleEnd" className="flex items-center">
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
                                                        className={`max-w-xs p-3 rounded-md border text-sm ${formData.ownEvent
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
                                                    disabled={!formData.ownEvent}
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
                                                                    <h4 className="font-medium">{tier.name || "Unnamed Tier"}</h4>
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
                                                    Add Ticket Category
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="ticketNeedsAttendeeImage"
                                                    checked={formData.ticketNeedsAttendeeImage}
                                                    onCheckedChange={() => handleTicketNeedsAttendeeImageChange()}
                                                />
                                                <Label htmlFor="ticketNeedsAttendeeImage">This ticket requires an attendee image</Label>
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
                                                {isEditing && !formData.poster && posterPreview && (
                                                    <span className="ml-2 text-sm text-gray-500">(Current poster shown)</span>
                                                )}
                                            </Label>
                                            <div
                                                {...getPosterRootProps()}
                                                className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 transition-colors
                                                    ${isPosterDragActive ? "bg-gray-100 border-blue-500" : "hover:bg-gray-100"}
                                                    ${isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                            >
                                                <input {...getPosterInputProps()} />
                                                {posterPreview ? (
                                                    <div className="space-y-4 w-full">
                                                        <div className="relative aspect-[3/2] w-full max-w-md mx-auto overflow-hidden rounded-lg">
                                                            <img
                                                                src={posterPreview || "/placeholder.svg"}
                                                                alt="Event poster preview"
                                                                className="object-cover w-full h-full"
                                                            />
                                                        </div>
                                                        <div className="flex justify-center">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => (document.querySelector('input[type="file"][name="poster"]') as HTMLInputElement | null)?.click()}
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
                                                        <div className="flex justify-center mt-2">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                                                                <ImageIcon className="h-4 w-4 mr-1 text-blue-500" />
                                                                Recommended Poster Size: <span className="ml-1 font-bold">1200x800 </span> pixels
                                                            </span>
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-semibold border border-yellow-200 shadow-sm ml-2">
                                                                Max file size: <span className="ml-1 font-bold">2MB</span> (for best performance)
                                                            </span>
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
                                            <Label htmlFor="registrationOpen" className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                Registration Open Date
                                            </Label>
                                            <Input
                                                id="registrationOpen"
                                                name="registrationOpen"
                                                type="date"
                                                value={formData.registrationOpen}
                                                onChange={handleBasicInfoChange}
                                                className="h-11"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="registrationClose" className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                Registration Close Date
                                            </Label>
                                            <Input
                                                id="registrationClose"
                                                name="registrationClose"
                                                type="date"
                                                value={formData.registrationClose}
                                                onChange={handleBasicInfoChange}
                                                className="h-11"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="minimumPaymentPercent" className="flex items-center">
                                                <Percent className="h-4 w-4 mr-1" />
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
                                                    minimumPaymentPercent: Number.parseFloat(e.target.value) || 0,
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
                                    <Button type="button" variant="secondary" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                                        Next
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isSubmitting ? (isEditing ? "Updating Event..." : "Creating Event...") : (isEditing ? "Update Event" : "Create Event")}
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