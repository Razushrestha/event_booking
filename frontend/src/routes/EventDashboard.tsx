import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    Home,
    Search,
    Filter,
    Eye,
    Calendar,
    Clock,
    Plus,
    MapPin,
    Ticket,
    Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminSidebar } from "@/components/Sidebar"
import PaginationControls from "@/components/AdminDashboard.tsx/PaginationControls"
import { notifyError } from "@/components/toast"
import { getEventDashboard } from "@/services/eventServices"
import formatCurrency from "@/components/utils/formatCurrency"

interface TicketTier {
    name: string
    price: number
    listOfFeatures: string[]
}

interface EventData {
    _id: string
    eventId: string
    title: string
    location: string
    public: boolean
    startDateTime: string
    endDateTime: string
    ticketTiers: TicketTier[]
    createdAt: string
}

interface Pagination {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
    nextPage: number | null
    prevPage: number | null
}

interface Metrics {
    totalEvents: number
    upcoming: number
    ongoing: number
    past: number
}

interface EventsResponse {
    data: {
        metrics: Metrics
        events: EventData[]
        pagination: Pagination
    }
}
export default function EventDashboard() {
    const navigate = useNavigate()
    const [eventsData, setEventsData] = useState<EventsResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState("newest")
    const [statusFilter, setStatusFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)

    // Fetch data from backend
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const response = await getEventDashboard({ sortBy, search: searchTerm || undefined, page: currentPage })
                console.log("Fetched events:", response)
                setEventsData(response)
            } catch (error) {
                console.error("Failed to fetch events:", error)
                notifyError("Failed to load events")
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [sortBy, searchTerm, currentPage])

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, sortBy, statusFilter])

    // Filter events locally based on status
    const getFilteredEvents = (events: EventData[]) => {
        if (statusFilter === "all") return events
        const now = new Date()
        return events.filter(event => {
            const start = new Date(event.startDateTime)
            const end = new Date(event.endDateTime)
            if (statusFilter === "upcoming") return start > now
            if (statusFilter === "ongoing") return start <= now && end >= now
            if (statusFilter === "past") return end < now
            return true
        })
    }

    const getInitials = (title: string) => {
        return title
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        })
    }

    const getStatusBadge = (event: EventData) => {
        const now = new Date()
        const start = new Date(event.startDateTime)
        const end = new Date(event.endDateTime)
        if (start > now) {
            return <Badge variant="outline" className="bg-blue-100 text-blue-600">Upcoming</Badge>
        } else if (start <= now && end >= now) {
            return <Badge variant="outline" className="bg-green-100 text-green-600">Ongoing</Badge>
        } else {
            return <Badge variant="outline" className="bg-gray-100 text-gray-600">Past</Badge>
        }
    }

    const metrics = eventsData?.data.metrics || { totalEvents: 0, upcoming: 0, ongoing: 0, past: 0 }
    const events = eventsData?.data.events || []
    const filteredEvents = getFilteredEvents(events)
    const pagination = eventsData?.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 10,
        hasNext: false,
        hasPrev: false,
        nextPage: null,
        prevPage: null
    }

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage)
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
                        <h2 className="text-lg font-medium">Events Management</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <span className="text-sm text-gray-600">Admin User</span>
                        <Avatar>
                            <AvatarFallback>AU</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Stats Cards */}
                        <div className="grid gap-6 md:grid-cols-4">
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>Total Events</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <Calendar className="h-6 w-6 text-blue-500 mr-1" />
                                        {isLoading ? (
                                            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                        ) : (
                                            metrics.totalEvents
                                        )}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>Upcoming</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <Clock className="h-6 w-6 text-amber-500 mr-1" />
                                        {isLoading ? (
                                            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                        ) : (
                                            metrics.upcoming
                                        )}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>Ongoing</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <Ticket className="h-6 w-6 text-green-500 mr-1" />
                                        {isLoading ? (
                                            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                        ) : (
                                            metrics.ongoing
                                        )}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>Past</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <MapPin className="h-6 w-6 text-gray-500 mr-1" />
                                        {isLoading ? (
                                            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                        ) : (
                                            metrics.past
                                        )}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </div>

                        {/* Filters and Search */}
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <div>
                                        <CardTitle>All Events</CardTitle>
                                        <CardDescription>Manage and review events</CardDescription>
                                    </div>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <div className="relative flex-1 sm:w-80">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                placeholder="Search events by name..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-40">
                                                <Filter className="h-4 w-4 mr-2" />
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-50">
                                                <SelectItem value="all" className="hover:bg-gray-100">All Status</SelectItem>
                                                <SelectItem value="upcoming" className="hover:bg-gray-100">Upcoming</SelectItem>
                                                <SelectItem value="ongoing" className="hover:bg-gray-100">Ongoing</SelectItem>
                                                <SelectItem value="past" className="hover:bg-gray-100">Past</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={sortBy} onValueChange={setSortBy}>
                                            <SelectTrigger className="w-40">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-50">
                                                <SelectItem value="newest" className="hover:bg-gray-100">Newest</SelectItem>
                                                <SelectItem value="oldest" className="hover:bg-gray-100">Oldest</SelectItem>
                                                <SelectItem value="startSoonest" className="hover:bg-gray-100">Start Soonest</SelectItem>
                                                <SelectItem value="startLatest" className="hover:bg-gray-100">Start Latest</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={() => navigate("/admin/events/add")} className="ml-auto bg-blue-600 hover:bg-blue-500 text-white">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add New Event
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : filteredEvents.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-700">No events found</h3>
                                        <p className="text-gray-500">
                                            {searchTerm || statusFilter !== "all"
                                                ? "Try adjusting your search or filter criteria"
                                                : "No events have been created yet"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                        <th className="px-4 py-3">Event</th>
                                                        <th className="px-4 py-3">Location</th>
                                                        <th className="px-4 py-3">Date</th>
                                                        <th className="px-4 py-3">Ticket Categories</th>
                                                        <th className="px-4 py-3">Status</th>
                                                        <th className="px-4 py-3">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {filteredEvents.map((event) => (
                                                        <tr key={event._id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <Avatar className="h-8 w-8 mr-3">
                                                                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                                                            {getInitials(event.title)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="font-medium text-gray-900">{event.title}</div>
                                                                        <div className="text-xs text-gray-500">ID: {event.eventId.substring(0, 8)}...</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">{event.location}</td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                {formatDate(event.startDateTime)}
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                {event.ticketTiers.map(tier => (
                                                                    <Badge key={tier.name} variant="outline" className="mr-1 mb-1">
                                                                        {tier.name}: {formatCurrency(tier.price)}
                                                                    </Badge>
                                                                ))}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(event)}</td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => navigate(`/admin/events/${event.eventId}`)}
                                                                >
                                                                    <Eye className="h-4 w-4 mr-1" />
                                                                    View
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="md:hidden space-y-4">
                                            {filteredEvents.map((event) => (
                                                <Card key={event._id} className="border border-gray-200">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center">
                                                                <Avatar className="h-10 w-10 mr-3">
                                                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                                                        {getInitials(event.title)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <h3 className="font-medium">{event.title}</h3>
                                                                    <p className="text-sm text-gray-500">{event.location}</p>
                                                                </div>
                                                            </div>
                                                            {getStatusBadge(event)}
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Date:</span>
                                                                <span>{formatDate(event.startDateTime)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Ticket Categories:</span>
                                                                <div>
                                                                    {event.ticketTiers.map(tier => (
                                                                        <Badge key={tier.name} variant="outline" className="mr-1">
                                                                            {tier.name}: {formatCurrency(tier.price)}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 pt-3 border-t">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full"
                                                                onClick={() => navigate(`/events/${event.eventId}`)}
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View Details
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>

                                        {/* Pagination */}
                                        {pagination.totalPages > 1 && (
                                            <div className="border-t pt-4">
                                                <PaginationControls
                                                    currentPage={pagination.currentPage}
                                                    totalPages={pagination.totalPages}
                                                    hasNext={pagination.hasNext}
                                                    hasPrev={pagination.hasPrev}
                                                    onPageChange={handlePageChange}
                                                    totalCount={pagination.totalCount}
                                                    limit={pagination.limit}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}