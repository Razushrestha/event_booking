"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Calendar, Clock, Edit, Home, MapPin, Share2, Ticket, Users, Store, ScrollText, Trash2, User, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { AdminSidebar } from "@/components/Sidebar"
import { notifyError, notifySuccess } from "@/components/toast"
import { getEventById, deleteEventByAdmin, getTermsAndConditions, saveTermsAndConditions } from "@/services/eventServices"
import formatCurrency from "@/components/utils/formatCurrency"
import formatDate from "@/components/utils/formatDate"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface TicketTier {
    name: string
    price: number | null
    listOfFeatures: string[]
}

interface Event {
    _id: string
    title: string
    description: string
    public: boolean
    startDateTime: string
    endDateTime: string
    scheduleStart?: string
    scheduleEnd?: string
    location: string
    googleMapUrl?: string
    organizer: string
    organizerLogo: string | null
    hasStalls: boolean
    ownEvent: boolean
    poster: string
    promoImages: string[]
    ticketTiers: TicketTier[]
    proposal?: string
    eventId: string
    createdAt: string
    updatedAt: string
    __v: number
    entryType?: string
    eventType?: string
    registrationOpen?: string | null
    registrationClose?: string | null
    floorPlan?: string | null
    floorPlans?: string[]
    termsAndConditions?: string | null
}

export default function EventViewPage() {
    const params = useParams()
    const router = useNavigate()
    const [event, setEvent] = useState<Event | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isTermsDialogOpen, setIsTermsDialogOpen] = useState(false)
    const [termsAndConditions, setTermsAndConditions] = useState("")
    const [isSavingTerms, setIsSavingTerms] = useState(false)

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                console.log("Fetching event with ID:", params.eventId)
                setIsLoading(true)
                if (typeof params.eventId === "string") {
                    const eventData = await getEventById(params.eventId)
                    console.log("Fetched event data:", eventData)
                    setEvent(eventData)
                    // Fetch terms and conditions
                    try {
                        const terms = await getTermsAndConditions(params.eventId)
                        setTermsAndConditions(terms || "")
                    } catch (error) {
                        console.error("Failed to fetch terms:", error)
                    }
                } else {
                    throw new Error("Event ID is missing")
                }
            } catch (error) {
                console.error("Failed to fetch event:", error)
                notifyError("Failed to load event details")
            } finally {
                setIsLoading(false)
            }
        }

        fetchEvent()
    }, [params.eventId])

    const handleEditEvent = () => {
        if (event) {
            router(`/admin/events/${event.eventId}/edit`)
        }
    }

    const handleDeleteEvent = async (
        event: { eventId: string } | null,
        setIsDeleting: (isDeleting: boolean) => void,
        setIsDialogOpen: (isOpen: boolean) => void,
        router: (path: string) => void
    ) => {
        if (!event) return;

        setIsDeleting(true);
        try {
            const result = await deleteEventByAdmin(event.eventId);
            if (result.success) {
                notifySuccess("Event deleted successfully");
                setTimeout(() => {
                    router("/admin/events");
                }, 2000);
            } else {
                notifyError(result.message || "Failed to delete event");
            }
        } catch (error) {
            console.error("Failed to delete event:", error);
            notifyError("Failed to delete event");
        } finally {
            setIsDeleting(false);
            setIsDialogOpen(false);
        }
    };

    const handleSaveTermsAndConditions = async () => {
        if (!event) return;

        setIsSavingTerms(true);
        try {
            const result = await saveTermsAndConditions(event.eventId, termsAndConditions);
            if (result.success) {
                notifySuccess("Terms and conditions saved successfully");
                setEvent({ ...event, termsAndConditions });
                setIsTermsDialogOpen(false);
            } else {
                notifyError(result.message || "Failed to save terms and conditions");
            }
        } catch (error) {
            console.error("Failed to save terms and conditions:", error);
            notifyError("Failed to save terms and conditions");
        } finally {
            setIsSavingTerms(false);
        }
    };

    const getDurationInDays = (start: string, end: string) => {
        const startDate = new Date(start)
        const endDate = new Date(end)
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Home className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-medium">Event Details</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        {!isLoading && event && event.ownEvent && (
                            <>
                                <Button
                                    onClick={() => {
                                        if (event) {
                                            router(`/admin/events/proposal/${event.eventId}`)
                                        }
                                    }}
                                    className="bg-yellow-300 hover:bg-yellow-500"
                                >
                                    <ScrollText className="h-4 w-4 mr-2" />
                                    {event.proposal && event.proposal.trim() !== "" ? "Edit Proposal" : "Add Proposal"}
                                </Button>
                                <Dialog open={isTermsDialogOpen} onOpenChange={setIsTermsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-purple-300 hover:bg-purple-500">
                                            <FileText className="h-4 w-4 mr-2" />
                                            {event.termsAndConditions && event.termsAndConditions.trim() !== "" ? "Edit Terms & Conditions" : "Add Terms & Conditions"}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[600px] bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 border border-gray-400 shadow-xl rounded-lg">
                                        <DialogHeader>
                                            <DialogTitle className="text-gray-800">Terms and Conditions</DialogTitle>
                                            <DialogDescription className="text-gray-700">
                                                Enter or edit the terms and conditions for this event.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                            <Textarea
                                                value={termsAndConditions}
                                                onChange={(e) => setTermsAndConditions(e.target.value)}
                                                placeholder="Enter terms and conditions..."
                                                className="min-h-[200px]"
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsTermsDialogOpen(false)}
                                                disabled={isSavingTerms}
                                                className="border border-gray-400 text-gray-700 bg-gray-100 hover:bg-gray-200"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleSaveTermsAndConditions}
                                                disabled={isSavingTerms}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                {isSavingTerms ? "Saving..." : "Save"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </>
                        )}
                        {!isLoading && event && event.hasStalls && (
                            <Button
                                onClick={() => {
                                    if (event) {
                                        router(`/admin/stalls-setup/${event.eventId}`)
                                    }
                                }}
                                className="bg-green-400 hover:bg-green-500"
                            >
                                <Store className="h-4 w-4 mr-2" />
                                Edit Stalls
                            </Button>
                        )}
                        {!isLoading && event && (
                            <Button onClick={handleEditEvent} className="bg-blue-600 hover:bg-blue-700">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Event
                            </Button>
                        )}
                        <span className="text-sm text-gray-600">Admin User</span>
                        <Avatar>
                            <AvatarImage src="/placeholder.svg" alt="Admin" />
                            <AvatarFallback>AU</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : event ? (
                        <div className="max-w-6xl mx-auto space-y-6">
                            {/* Event Header */}
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Event Poster */}
                                <div className="w-full md:w-1/3">
                                    <Card className="border-none shadow-lg overflow-hidden">
                                        <div className="aspect-[3/4] relative">
                                            <img
                                                src={import.meta.env.VITE_IMAGE_URL + event.poster || "/placeholder.svg?height=600&width=450"}
                                                alt={`${event.title} poster`}
                                                className="object-contain w-full h-full"
                                            />
                                        </div>
                                    </Card>
                                </div>

                                {/* Event Details */}
                                <div className="w-full md:w-2/3">
                                    <Card className="border-none shadow-lg h-full">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-3xl font-bold">{event.title}</CardTitle>
                                                    <CardDescription className="text-lg mt-2 flex gap-2">
                                                        {event.public ? (
                                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Public</Badge>
                                                        ) : (
                                                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Private</Badge>
                                                        )}
                                                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                                            {event.entryType === 'free' ? 'Free' : 'Paid'} Event
                                                        </Badge>
                                                        {event.eventType && (
                                                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                                                                {event.eventType}
                                                            </Badge>
                                                        )}
                                                    </CardDescription>
                                                </div>
                                                <Button variant="outline" size="icon">
                                                    <Share2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-medium">About this event</h3>
                                                <p className="text-gray-600">{event.description}</p>
                                            </div>

                                            <Separator />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-start">
                                                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                                                    <div>
                                                        <h4 className="font-medium">Date</h4>
                                                        <p className="text-sm text-gray-600 mt-1">{formatDate(event.startDateTime)}</p>
                                                        <p className="text-sm text-gray-600">to</p>
                                                        <p className="text-sm text-gray-600">{formatDate(event.endDateTime)}</p>
                                                        <p className="text-sm text-blue-600 font-medium mt-1">
                                                            {getDurationInDays(event.startDateTime, event.endDateTime)} day
                                                            {getDurationInDays(event.startDateTime, event.endDateTime) > 1 ? "s" : ""} event
                                                        </p>
                                                    </div>
                                                </div>

                                                {event.scheduleStart && event.scheduleEnd && (
                                                    <div className="flex items-start">
                                                        <Clock className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                                                        <div>
                                                            <h4 className="font-medium">Schedule</h4>
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                {event.scheduleStart} to {event.scheduleEnd}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-start">
                                                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                                                    <div>
                                                        <h4 className="font-medium">Location</h4>
                                                        <p className="text-sm text-gray-600 mt-1">{event.location || 'Venue information not provided'}</p>
                                                        {event.googleMapUrl && (
                                                            <a
                                                                href={event.googleMapUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-blue-600 hover:underline"
                                                            >
                                                                View on Google Maps
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-start">
                                                    <User className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                                                    <div>
                                                        <h4 className="font-medium">Organizer</h4>
                                                        <div className="flex items-center mt-1">
                                                            {event.organizerLogo ? (
                                                                <Avatar className="h-8 w-8 mr-2">
                                                                    <AvatarImage
                                                                        src={import.meta.env.VITE_IMAGE_URL + event.organizerLogo}
                                                                        alt={`${event.organizer} logo`}
                                                                    />
                                                                    <AvatarFallback>
                                                                        {event.organizer ? event.organizer.charAt(0).toUpperCase() : 'O'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            ) : (
                                                                <Avatar className="h-8 w-8 mr-2">
                                                                    <AvatarFallback>
                                                                        {event.organizer ? event.organizer.charAt(0).toUpperCase() : 'O'}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            )}
                                                            <p className="text-sm text-gray-600">{event.organizer || 'Organizer not specified'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-start">
                                                    <Ticket className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                                                    <div>
                                                        <h4 className="font-medium">Ticket Categories</h4>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {event.ticketTiers.length} {event.entryType === 'free' ? 'entry type' : 'categories'} available
                                                        </p>
                                                    </div>
                                                </div>

                                                {(event.registrationOpen || event.registrationClose) && (
                                                    <div className="flex items-start">
                                                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                                                        <div>
                                                            <h4 className="font-medium">Registration Period</h4>
                                                            {event.registrationOpen && (
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    Opens: {formatDate(event.registrationOpen)}
                                                                </p>
                                                            )}
                                                            {event.registrationClose && (
                                                                <p className="text-sm text-gray-600">
                                                                    Closes: {formatDate(event.registrationClose)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-start">
                                                    <Clock className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                                                    <div>
                                                        <h4 className="font-medium">Created</h4>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {new Date(event.createdAt).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Updated: {new Date(event.updatedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                {event.hasStalls && (
                                                    <div className="flex flex-col items-start mt-4">
                                                        <Button
                                                            variant="link"
                                                            className="text-blue-600 px-0 hover:underline flex items-center gap-1"
                                                            onClick={() => router(`/admin/bookings/event/${event.eventId}`)}
                                                        >
                                                            <Users className="h-4 w-4 mr-1" />
                                                            <span>View All Bookings</span>
                                                        </Button>
                                                    </div>
                                                )}
                                                {event.ownEvent && (
                                                    <div className="flex flex-col items-start mt-4">
                                                        <Button
                                                            variant="link"
                                                            className="text-blue-600 px-0 hover:underline flex items-center gap-1"
                                                            onClick={() => router(`/admin/tickets/event/${event.eventId}`)}
                                                        >
                                                            <Users className="h-4 w-4 mr-1" />
                                                            <span>View All Tickets</span>
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {/* Ticket Categories */}
                            {event.ownEvent && (
                                <Card className="border-none shadow-lg">
                                    <CardHeader>
                                        <CardTitle>{event.entryType === 'free' ? 'Entry Type' : 'Ticket Categories'}</CardTitle>
                                        <CardDescription>
                                            {event.entryType === 'free' ? 'Entry details for this event' : 'Available ticket options for this event'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                            {event.ticketTiers.map((tier, index) => (
                                                <Card key={index} className="border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-200">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-xl font-semibold">{tier.name}</CardTitle>
                                                        <CardDescription className="text-2xl font-bold text-blue-600 mt-2">
                                                            {tier.price === null || tier.price === 0 ? 'Free' : formatCurrency(tier.price)}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        {tier.listOfFeatures.length > 0 ? (
                                                            <ul className="space-y-2 mt-2">
                                                                {tier.listOfFeatures.map((feature, fIndex) => (
                                                                    <li key={fIndex} className="flex items-start">
                                                                        <span className="h-2 w-2 rounded-full bg-blue-500 mt-2 mr-3 flex-shrink-0" />
                                                                        <span className="text-sm text-gray-700">{feature}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className="text-sm text-gray-600">No additional features included</p>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                        <div className="flex justify-end mt-4">
                                            <Button
                                                variant="link"
                                                className="text-blue-600 hover:underline"
                                                onClick={() => router(`/admin/bookings/event/${event.eventId}`)}
                                            >
                                                View all Bookings
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end space-x-4">
                                <Button variant="outline" onClick={() => router("/admin/events")}>
                                    Back to Events
                                </Button>
                                <Button onClick={handleEditEvent} className="bg-blue-600 hover:bg-blue-700">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Event
                                </Button>
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            className="bg-red-600 hover:bg-red-700 border border-red-700 text-white"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Event
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px] bg-gradient-to-b from-gray-100 via-gray-200 to-gray-300 border border-gray-400 shadow-xl rounded-lg">
                                        <DialogHeader>
                                            <DialogTitle className="text-gray-800">Delete Event</DialogTitle>
                                            <DialogDescription className="text-gray-700">
                                                Are you sure you want to delete this event? All data associated with this event, including stalls, bookings, tickets, poster, and other related information, will be permanently deleted. This action cannot be undone.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <DialogFooter>
                                            <Button
                                                variant="outline"
                                                onClick={() => setIsDialogOpen(false)}
                                                disabled={isDeleting}
                                                className="border border-gray-400 text-gray-700 bg-gray-100 hover:bg-gray-200"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                onClick={() => handleDeleteEvent(event, setIsDeleting, setIsDialogOpen, router)}
                                                disabled={isDeleting}
                                                className="bg-red-600 hover:bg-red-700 border border-red-700 text-white"
                                            >
                                                {isDeleting ? "Deleting..." : "Delete Event"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                            <h3 className="text-xl font-medium text-gray-700">Event not found</h3>
                            <p className="text-gray-500 mt-2">The event you're looking for doesn't exist or has been removed.</p>
                            <Button className="mt-4" onClick={() => router("/admin/events")}>
                                Back to Events
                            </Button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}