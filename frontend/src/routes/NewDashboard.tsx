"use client"

import {
    Calendar,
    CheckCircle,
    Clock,
    Home,
    Ticket,
    Eye,
    Plus,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AdminSidebar } from "@/components/Sidebar.tsx"
import { useEffect, useState } from "react"
import { getDashboardData, getPendingTickets, getRecentRegistrations, getUpcomingEvents } from "@/services/dashboardServices"
import AdminDashboardSkeleton from "@/components/DashboardSkeleton"
import { notifyError, notifySuccess } from "@/components/toast"
import { approveTicketByAdmin } from "@/services/ticketServices"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import formatDate from "@/components/utils/formatDate"

// Pagination component
const PaginationControls = ({
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    onPageChange,
    totalCount,
    limit,
}: {
    currentPage: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
    onPageChange: (page: number) => void
    totalCount: number
    limit: number
}) => {
    const startItem = (currentPage - 1) * limit + 1
    const endItem = Math.min(currentPage * limit, totalCount)

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-gray-700">
                Showing {startItem} to {endItem} of {totalCount} results
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrev}
                    className="h-8 w-8 p-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                </span>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNext}
                    className="h-8 w-8 p-0"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

export default function AdminDashboard() {
    useEffect(() => {
        console.log('AdminDashboard rendered');
    });
    const navigate = useNavigate()
    const [error, setError] = useState(false)
    const [serverError, setServerError] = useState(false)
    const [dashboardData, setDashboardData] = useState<any>()
    const [loading, setLoading] = useState(true)

    // Pagination states
    const [pendingTicketsPage, setPendingTicketsPage] = useState(1)
    const [pendingTicketsData, setPendingTicketsData] = useState<any>()
    const [pendingTicketsLoading, setPendingTicketsLoading] = useState(false)

    const [recentRegistrationsPage, setRecentRegistrationsPage] = useState(1)
    const [recentRegistrationsData, setRecentRegistrationsData] = useState<any>()
    const [recentRegistrationsLoading, setRecentRegistrationsLoading] = useState(false)

    const [upcomingEventsPage, setUpcomingEventsPage] = useState(1)
    const [upcomingEventsData, setUpcomingEventsData] = useState<any>()
    const [upcomingEventsLoading, setUpcomingEventsLoading] = useState(false)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true)
                setError(false)
                setServerError(false)
                const data = await getDashboardData()
                if (!data) {
                    notifyError("No data found")
                    throw new Error("No data found")
                } else {
                    setDashboardData(data)

                    // Initialize paginated data with the response data
                    setPendingTicketsData({
                        tickets: data.pendingTickets,
                        pagination: {
                            totalPages: 1,
                            hasNext: data.pagination?.pendingTickets?.hasMore || false,
                            hasPrev: false,
                            totalCount: data.pagination?.pendingTickets?.total || data.pendingTickets.length,
                            limit: data.pendingTickets.length,
                        },
                    })

                    setRecentRegistrationsData({
                        registrations: data.recentRegistrations,
                        pagination: {
                            totalPages: Math.ceil(
                                (data.pagination?.recentRegistrations?.total || data.recentRegistrations.length) / 5,
                            ),
                            hasNext: data.pagination?.recentRegistrations?.hasMore || false,
                            hasPrev: false,
                            totalCount: data.pagination?.recentRegistrations?.total || data.recentRegistrations.length,
                            limit: 5,
                        },
                    })

                    setUpcomingEventsData({
                        events: data.upcomingEvents,
                        pagination: {
                            totalPages: Math.ceil(data.upcomingEvents.length / 6),
                            hasNext: data.pagination?.upcomingEvents?.hasMore || false,
                            hasPrev: false,
                            totalCount: data.pagination?.upcomingEvents?.total || data.upcomingEvents.length,
                            limit: 6,
                        },
                    })

                    setLoading(false)
                }
            } catch (error: any) {
                console.error("Error fetching dashboard data:", error)
                if (error.response?.status === 500) {
                    setServerError(true)
                } else {
                    setError(true)
                    notifyError("Dashboard Data could not be loaded")
                }
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    // Fetch paginated pending tickets
    const fetchPendingTickets = async (page: number) => {
        if (page === 1 && pendingTicketsData) {
            setPendingTicketsData({
                tickets: dashboardData.pendingTickets,
                pagination: {
                    totalPages: 1,
                    hasNext: dashboardData.pagination?.pendingTickets?.hasMore || false,
                    hasPrev: false,
                    totalCount: dashboardData.pagination?.pendingTickets?.total || dashboardData.pendingTickets.length,
                    limit: dashboardData.pendingTickets.length,
                },
            })
            return;
        }

        setPendingTicketsLoading(true);
        try {
            const data = await getPendingTickets(page, 5);
            setPendingTicketsData(data);
        } catch (error) {
            notifyError("Failed to fetch pending tickets");
        } finally {
            setPendingTicketsLoading(false);
        }
    };

    // Fetch paginated recent registrations
    const fetchRecentRegistrations = async (page: number) => {
        if (page === 1 && recentRegistrationsData) {
            setRecentRegistrationsData({
                registrations: dashboardData.recentRegistrations,
                pagination: {
                    totalPages: Math.ceil(
                        (dashboardData.pagination?.recentRegistrations?.total || dashboardData.recentRegistrations.length) / 5,
                    ),
                    hasNext: dashboardData.pagination?.recentRegistrations?.hasMore || false,
                    hasPrev: false,
                    totalCount: dashboardData.pagination?.recentRegistrations?.total || dashboardData.recentRegistrations.length,
                    limit: 5,
                },
            })
            return;
        }

        setRecentRegistrationsLoading(true);
        try {
            const data = await getRecentRegistrations(page, 5);
            setRecentRegistrationsData(data);
        } catch (error) {
            notifyError("Failed to fetch recent registrations");
        } finally {
            setRecentRegistrationsLoading(false);
        }
    };

    // Fetch paginated upcoming events
    const fetchUpcomingEvents = async (page: number) => {
        if (page === 1 && upcomingEventsData) {
            setUpcomingEventsData({
                events: dashboardData.upcomingEvents,
                pagination: {
                    totalPages: Math.ceil(dashboardData.upcomingEvents.length / 6),
                    hasNext: dashboardData.pagination?.upcomingEvents?.hasMore || false,
                    hasPrev: false,
                    totalCount: dashboardData.pagination?.upcomingEvents?.total || dashboardData.upcomingEvents.length,
                    limit: 6,
                },
            })
            return;
        }

        setUpcomingEventsLoading(true);
        try {
            const data = await getUpcomingEvents(page, 6);
            setUpcomingEventsData(data);
        } catch (error) {
            notifyError("Failed to fetch upcoming events");
        } finally {
            setUpcomingEventsLoading(false);
        }
    };

    const handleApproveTicket = async (ticketId: string) => {
        const response = await approveTicketByAdmin(ticketId)
        if (response.status !== 200) {
            notifyError("Ticket could not be approved")
            return
        }

        // Update dashboard data
        const updatedTickets = dashboardData.pendingTickets.filter((ticket: any) => ticket.ticketId !== ticketId)
        setDashboardData((prevData: any) => ({
            ...prevData,
            pendingTickets: updatedTickets,
            metrics: {
                ...prevData.metrics,
                pendingTickets: prevData.metrics.pendingTickets - 1,
            },
        }))

        // Update paginated data
        if (pendingTicketsData) {
            const updatedPaginatedTickets = pendingTicketsData.tickets.filter((ticket: any) => ticket.ticketId !== ticketId)
            setPendingTicketsData((prevData: any) => ({
                ...prevData,
                tickets: updatedPaginatedTickets,
                pagination: {
                    ...prevData.pagination,
                    totalCount: prevData.pagination.totalCount - 1,
                },
            }))
        }

        notifySuccess(`Ticket has been approved`)
    }

    const handlePendingTicketsPageChange = (page: number) => {
        setPendingTicketsPage(page)
        fetchPendingTickets(page)
    }

    const handleRecentRegistrationsPageChange = (page: number) => {
        setRecentRegistrationsPage(page)
        fetchRecentRegistrations(page)
    }

    const handleUpcomingEventsPageChange = (page: number) => {
        setUpcomingEventsPage(page)
        fetchUpcomingEvents(page)
    }

    const handleEventClick = (eventId: string) => {
        navigate(`/events/${eventId}`)
    }

    // Prepare chart data for event ticket statistics
    const prepareChartData = (eventTicketStats: any[]) => {
        return eventTicketStats.map((stat) => ({
            eventName: stat.eventName.length > 15 ? stat.eventName.substring(0, 15) + "..." : stat.eventName,
            fullEventName: stat.eventName,
            approved: stat.approved,
            pending: stat.pending,
            rejected: stat.rejected,
            total: stat.total,
        }))
    }

    const COLORS = {
        approved: "#22c55e",
        pending: "#f59e0b",
        rejected: "#ef4444",
    }

    const getUserName = (ticket: any) => {
        return ticket.name || ticket.userId || "Unknown User"
    }

    if (loading) {
        return <AdminDashboardSkeleton />
    }

    if (serverError) {
        return (
            <div className="flex h-screen bg-gray-50">
                <AdminSidebar />
                <div className="flex-1 flex items-center justify-center bg-gray-100">
                    <Card className="w-full max-w-md shadow-xl">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl text-red-600">Server Error</CardTitle>
                            <CardDescription className="text-gray-600">
                                We're experiencing a server issue. Please try again later.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-500 text-center">
                                Error 500: Internal Server Error
                            </p>
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Retry
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-screen bg-gray-50">
                <AdminSidebar />
                <div className="flex-1 flex items-center justify-center">
                    <Card className="w-96">
                        <CardHeader>
                            <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
                            <CardDescription>
                                There was an error loading the dashboard data. Please try refreshing the page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => window.location.reload()} className="w-full">
                                Refresh Page
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
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
                        <h2 className="text-lg font-medium">Admin Dashboard</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Admin User</span>
                        <Avatar>
                            <AvatarImage src="/placeholder.svg" alt="Admin" />
                            <AvatarFallback>AU</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100">
                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="overview" className="cursor-pointer">
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="tickets" className="cursor-pointer">
                                Tickets
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            {/* Metrics */}
                            <div className="flex flex-col lg:flex-row gap-6 h-[600px] sm:h-[700px] lg:h-[800px] xl:h-[900px]">
                                {/* Metrics Cards */}
                                <div className="flex flex-row lg:flex-col gap-4 lg:gap-6 lg:w-64 lg:flex-none">
                                    <Card className="border-none shadow-lg flex-1 lg:flex-none">
                                        <CardHeader className="pb-2">
                                            <CardDescription>Total Revenue</CardDescription>
                                            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center">
                                                {/* <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mr-1" /> */}
                                                {/* <span className="text-blue-500">Rs. </span> */}
                                                {dashboardData?.metrics?.totalRevenue?.toLocaleString() || "0"}
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>

                                    <Card className="border-none shadow-lg flex-1 lg:flex-none">
                                        <CardHeader className="pb-2">
                                            <CardDescription>Total Tickets</CardDescription>
                                            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center">
                                                <Ticket className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mr-1" />
                                                {dashboardData?.metrics?.totalTickets?.toLocaleString() || "0"}
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>

                                    <Card className="border-none shadow-lg flex-1 lg:flex-none">
                                        <CardHeader className="pb-2">
                                            <CardDescription>Pending Tickets</CardDescription>
                                            <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center">
                                                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 mr-1" />
                                                {dashboardData?.metrics?.pendingTickets?.toLocaleString() || "0"}
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>
                                </div>

                                {/* Chart Section */}
                                <Card className="flex-1 border-none shadow-lg flex flex-col min-h-0">
                                    <CardHeader className="flex-none">
                                        <CardTitle>Event Ticket Statistics</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col min-h-0">
                                        {dashboardData?.eventTicketStats?.length === 0 ? (
                                            <p className="text-center text-gray-500 flex-1 flex items-center justify-center">No tickets so far</p>
                                        ) : (
                                            <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 h-full">
                                                {/* Bar Chart - Responsive Height */}
                                                <div className="flex-1 min-h-[250px] sm:min-h-[300px] lg:min-h-[350px]">
                                                    <ChartContainer
                                                        config={{
                                                            approved: {
                                                                label: "Approved",
                                                                color: COLORS.approved,
                                                            },
                                                            pending: {
                                                                label: "Pending",
                                                                color: COLORS.pending,
                                                            },
                                                            rejected: {
                                                                label: "Rejected",
                                                                color: COLORS.rejected,
                                                            },
                                                        }}
                                                        className="h-full w-full"
                                                    >
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart
                                                                data={prepareChartData(dashboardData?.eventTicketStats || [])}
                                                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                                            >
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis
                                                                    dataKey="eventName"
                                                                    tick={{ fontSize: 10 }}
                                                                    interval={0}
                                                                    angle={-45}
                                                                    textAnchor="end"
                                                                    height={60}
                                                                />
                                                                <YAxis tick={{ fontSize: 10 }} />
                                                                <ChartTooltip
                                                                    content={<ChartTooltipContent />}
                                                                    labelFormatter={(label, payload) => {
                                                                        const data = payload?.[0]?.payload
                                                                        return data?.fullEventName || label
                                                                    }}
                                                                />
                                                                <Legend />
                                                                <Bar dataKey="approved" fill={COLORS.approved} name="Approved" />
                                                                <Bar dataKey="pending" fill={COLORS.pending} name="Pending" />
                                                                <Bar dataKey="rejected" fill={COLORS.rejected} name="Rejected" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </ChartContainer>
                                                </div>

                                                {/* Summary Cards - Responsive Grid */}
                                                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 flex-none">
                                                    {dashboardData?.eventTicketStats?.map((stat: any) => (
                                                        <Card key={stat.eventId} className="border border-gray-200">
                                                            <CardHeader className="pb-2">
                                                                <CardTitle className="text-sm font-medium truncate">{stat.eventName}</CardTitle>
                                                                <CardDescription className="text-xs">{stat.total} total tickets</CardDescription>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="space-y-2">
                                                                    <div className="flex justify-between text-xs sm:text-sm">
                                                                        <span className="flex items-center">
                                                                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 mr-2"></div>
                                                                            Approved
                                                                        </span>
                                                                        <span>
                                                                            {stat.approved} ({Math.round((stat.approved / stat.total) * 100)}%)
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs sm:text-sm">
                                                                        <span className="flex items-center">
                                                                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-amber-500 mr-2"></div>
                                                                            Pending
                                                                        </span>
                                                                        <span>
                                                                            {stat.pending} ({Math.round((stat.pending / stat.total) * 100)}%)
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between text-xs sm:text-sm">
                                                                        <span className="flex items-center">
                                                                            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500 mr-2"></div>
                                                                            Rejected
                                                                        </span>
                                                                        <span>
                                                                            {stat.rejected} ({Math.round((stat.rejected / stat.total) * 100)}%)
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Upcoming Events */}
                            <Card className="border-none shadow-lg">
                                <CardHeader>
                                    <div className="flex justify-between">
                                        <CardTitle>Upcoming Events</CardTitle>
                                        <Button className="text-sm bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
                                            <a href="/admin/events/add" className="flex items-center">
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Event
                                            </a>
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {upcomingEventsLoading ? (
                                        <div className="text-center py-8">Loading events...</div>
                                    ) : upcomingEventsData?.events?.length > 0 ? (
                                        <>
                                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                {upcomingEventsData.events.map((event: any) => (
                                                    <Card
                                                        key={event.eventId}
                                                        className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
                                                        onClick={() => handleEventClick(event.eventId)}
                                                    >
                                                        <CardHeader className="pb-2">
                                                            <div className="flex items-start justify-between">
                                                                <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                                                                <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                                                            </div>
                                                            <div className="flex items-center text-sm text-gray-500">
                                                                <Calendar className="h-4 w-4 mr-1" />
                                                                {new Date(event.startDateTime).toLocaleDateString()}
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="pt-0">
                                                            <div className="flex flex-wrap gap-1">
                                                                {event.ticketTiers?.slice(0, 3).map((tier: any) => (
                                                                    <Badge key={tier.name} variant="outline" className="text-xs">
                                                                        {tier.name}
                                                                    </Badge>
                                                                ))}
                                                                {event.ticketTiers?.length > 3 && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        +{event.ticketTiers.length - 3} more
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                            <PaginationControls
                                                currentPage={upcomingEventsPage}
                                                totalPages={upcomingEventsData.pagination?.totalPages || 1}
                                                hasNext={upcomingEventsData.pagination?.hasNext || false}
                                                hasPrev={upcomingEventsData.pagination?.hasPrev || false}
                                                onPageChange={handleUpcomingEventsPageChange}
                                                totalCount={upcomingEventsData.pagination?.totalCount || 0}
                                                limit={upcomingEventsData.pagination?.limit || 6}
                                            />
                                        </>
                                    ) : (
                                        <p className="text-center text-gray-500 py-8">No upcoming events</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="tickets" className="space-y-6">
                            {/* Pending Tickets */}
                            <Card className="border-none shadow-lg">
                                <CardHeader>
                                    <div>
                                        <CardTitle>Pending Tickets</CardTitle>
                                        <CardDescription>Review and approve ticket registrations</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {pendingTicketsLoading ? (
                                        <div className="text-center py-8">Loading pending tickets...</div>
                                    ) : pendingTicketsData?.tickets?.length > 0 ? (
                                        <>
                                            <div className="space-y-4">
                                                {pendingTicketsData.tickets.map((ticket: any) => (
                                                    <div
                                                        key={ticket.ticketId}
                                                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100"
                                                    >
                                                        <div className="flex items-center flex-1 cursor-pointer" onClick={() => navigate(`/admin/tickets/${ticket.ticketId}`)}>
                                                            <Avatar className="h-8 w-8 mr-3">
                                                                <AvatarFallback>{ticket.name?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1">
                                                                <h3 className="font-medium">{getUserName(ticket)}</h3>
                                                                <p className="text-sm text-gray-500">{ticket.userId}</p>
                                                                <div className="mt-1 text-sm">
                                                                    <span className="text-gray-600">{ticket.eventName}</span>
                                                                    <span className="mx-2">•</span>
                                                                    <Badge variant="outline">{ticket.ticketInfo?.tierName}</Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-green-500 text-green-500 hover:bg-green-50"
                                                                onClick={() => handleApproveTicket(ticket.ticketId)}
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-blue-500 text-blue-500 hover:bg-blue-50"
                                                                onClick={() => navigate(`/admin/tickets/${ticket.ticketId}`)}
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                View
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <PaginationControls
                                                currentPage={pendingTicketsPage}
                                                totalPages={pendingTicketsData.pagination?.totalPages || 1}
                                                hasNext={pendingTicketsData.pagination?.hasNext || false}
                                                hasPrev={pendingTicketsData.pagination?.hasPrev || false}
                                                onPageChange={handlePendingTicketsPageChange}
                                                totalCount={pendingTicketsData.pagination?.totalCount || 0}
                                                limit={pendingTicketsData.pagination?.limit || 5}
                                            />
                                        </>
                                    ) : (
                                        <p className="text-center text-gray-500 py-8">No pending tickets</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Recent Registrations */}
                            <Card className="border-none shadow-lg">
                                <CardHeader>
                                    <CardTitle>Recent Registrations</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {recentRegistrationsLoading ? (
                                        <div className="text-center py-8">Loading recent registrations...</div>
                                    ) : recentRegistrationsData?.registrations?.length > 0 ? (
                                        <>
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            <th className="px-4 py-3">Event</th>
                                                            <th className="px-4 py-3">Name</th>
                                                            <th className="px-4 py-3">Tier</th>
                                                            <th className="px-4 py-3">Status</th>
                                                            <th className="px-4 py-3">Date</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {recentRegistrationsData.registrations.map((registration: any) => (
                                                            <tr key={registration.ticketId}>
                                                                <td className="px-4 py-3 whitespace-nowrap">{registration.eventName}</td>
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <div className="flex items-center">
                                                                        <Avatar className="h-6 w-6 mr-2">
                                                                            <AvatarFallback className="text-xs">
                                                                                {registration.name?.charAt(0)}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        {registration.name}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <Badge variant="outline">{registration.ticketInfo?.tierName}</Badge>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap">
                                                                    <Badge
                                                                        className={
                                                                            registration.status === "approved"
                                                                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                                                : registration.status === "pending"
                                                                                    ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                                                                    : "bg-red-100 text-red-800 hover:bg-red-100"
                                                                        }
                                                                    >
                                                                        {registration.status}
                                                                    </Badge>
                                                                </td>
                                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                                    {formatDate(registration.submittedAt)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <PaginationControls
                                                currentPage={recentRegistrationsPage}
                                                totalPages={recentRegistrationsData.pagination?.totalPages || 1}
                                                hasNext={recentRegistrationsData.pagination?.hasNext || false}
                                                hasPrev={recentRegistrationsData.pagination?.hasPrev || false}
                                                onPageChange={handleRecentRegistrationsPageChange}
                                                totalCount={recentRegistrationsData.pagination?.totalCount || 0}
                                                limit={recentRegistrationsData.pagination?.limit || 5}
                                            />
                                        </>
                                    ) : (
                                        <p className="text-center text-gray-500 py-8">No recent registrations</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    )
}