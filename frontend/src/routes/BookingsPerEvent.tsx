"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
    Home,
    Search,
    Filter,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    Store,
    Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminSidebar } from "@/components/Sidebar"
import { notifyError } from "@/components/toast"
import formatCurrency from "@/components/utils/formatCurrency"
import { getBookingsByEventId } from "@/services/bookingServices"
import PaginationControls from "@/components/AdminDashboard.tsx/PaginationControls"
import formatDate from "@/components/utils/formatDate"
import getStatusBadge from "@/components/utils/getStatusBadge"
import { exportBookingsCSV } from "@/services/bookingServices"

interface BusinessInfo {
    name: string
    phone: string
    email: string
}

interface BookingData {
    _id: string
    bookingId: string
    eventId?: string
    eventName?: string
    stallId?: string
    stallName?: string
    userId: string
    isHold?: boolean
    holdExpiry?: string
    totalAmount?: number
    paymentStatus?: "unpaid" | "remaining" | "paid"
    bookingCancelReason?: string
    qr?: string
    paymentProof?: string[]
    status: "pending" | "confirmed" | "cancelled" | "completed"
    businessInfo: BusinessInfo
    createdAt: string
    updatedAt?: string
}

interface Pagination {
    currentPage: number
    totalPages: number
    totalBookings: number
    hasNextPage: boolean
    hasPrevPage: boolean
    nextPage: number | null
    prevPage: number | null
    limit: number
    skip: number
}

interface Filters {
    status: string | null
    paymentStatus: string | null
    search: string | null
    sortBy: string
    sortOrder: string
}

interface BookingsResponse {
    bookings: BookingData[]
    pagination: Pagination
    filters: Filters
}

const getBookings = async (
    eventId: string,
    page = 1,
    status?: string,
    paymentStatus?: string,
    search?: string,
    sortBy = 'newest'
): Promise<BookingsResponse> => {
    try {
        const bookingData = await getBookingsByEventId({ eventId, page, status, paymentStatus, search, sortBy })
        return {
            bookings: bookingData.bookings,
            pagination: {
                currentPage: bookingData.pagination.currentPage,
                totalPages: bookingData.pagination.totalPages,
                totalBookings: bookingData.pagination.totalBookings,
                hasNextPage: bookingData.pagination.hasNextPage,
                hasPrevPage: bookingData.pagination.hasPrevPage,
                nextPage: bookingData.pagination.nextPage,
                prevPage: bookingData.pagination.prevPage,
                limit: bookingData.pagination.limit,
                skip: bookingData.pagination.skip,
            },
            filters: {
                status: status || null,
                paymentStatus: paymentStatus || null,
                search: search || null,
                sortBy: sortBy,
                sortOrder: sortBy === 'oldest' || sortBy === 'lowest' ? 'asc' : 'desc'
            }
        }
    } catch (error) {
        console.error("Failed to fetch bookings data:", error)
        throw error
    }
}

export default function EventBookingsPage() {
    const navigate = useNavigate()
    const { eventId } = useParams<{ eventId: string }>()
    const [bookingsData, setBookingsData] = useState<BookingsResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")
    const [sortByFilter, setSortByFilter] = useState("newest")
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        if (!eventId) {
            notifyError("Invalid event ID")
            return
        }

        const fetchData = async () => {
            try {
                setIsLoading(true)
                const data = await getBookings(
                    eventId,
                    currentPage,
                    statusFilter === "all" ? undefined : statusFilter,
                    paymentStatusFilter === "all" ? undefined : paymentStatusFilter,
                    searchTerm,
                    sortByFilter
                )
                setBookingsData(data)
                console.log("Bookings Data:", data)
            } catch (error) {
                console.error("Failed to fetch data:", error)
                notifyError("Failed to load bookings")
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [eventId, currentPage, statusFilter, paymentStatusFilter, searchTerm, sortByFilter])

    const getPaymentStatusBadge = (paymentStatus?: string) => {
        if (!paymentStatus) return <span className="text-gray-400">-</span>
        switch (paymentStatus) {
            case "paid":
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Paid
                    </Badge>
                )
            case "remaining":
                return (
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        <Clock className="h-3 w-3 mr-1" />
                        Partial
                    </Badge>
                )
            default:
                return (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XCircle className="h-3 w-3 mr-1" />
                        Unpaid
                    </Badge>
                )
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const eventName = bookingsData?.bookings[0]?.eventName || "Event"

    const handleDownloadBookings = async (eventId: string) => {
        try {
            const csvData = await exportBookingsCSV(eventId);
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const sanitizedEventName = eventName.replace(/[^a-zA-Z0-9]/g, '_');
            const a = document.createElement('a');
            a.href = url;
            const now = new Date();
            const localDateTime = now
                .toISOString()
                .replace(/[-:]/g, "")
                .replace("T", "_")
                .slice(0, 15); // e.g., 20240607_1530
            a.download = `Bookings_${sanitizedEventName}_${localDateTime}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); // Clean up the URL object
        } catch (error) {
            console.error('Failed to download tickets CSV:', error);
            notifyError('Failed to download tickets CSV');
        }
    };

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
                        <h2 className="text-lg font-medium">Event Bookings</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 cursor-pointer border-blue-200 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                            onClick={() => { eventId && navigate(`/book-stalls/${eventId}`) }}
                        >
                            {/* <Download className="h-4 w-4 text-blue-600" /> */}
                            <span className="font-medium text-blue-700">Add Booking</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 cursor-pointer border-blue-200 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                            onClick={() => eventId && handleDownloadBookings(eventId)}
                        >
                            <Download className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-700">Download CSV</span>
                        </Button>
                        <span className="text-sm text-gray-600">Admin User</span>
                        <Avatar>
                            <AvatarImage src="/placeholder.svg" alt="Admin" />
                            <AvatarFallback>AU</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Filters and Search */}
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{eventName}</h3>
                                        <CardTitle>Event Bookings</CardTitle>
                                        <CardDescription>Manage and review stall bookings for this event</CardDescription>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                        <div className="relative flex-1 sm:w-80">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                placeholder="Search bookings..."
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
                                            <SelectContent className="bg-white">
                                                <SelectItem value="all" className="hover:bg-gray-200">All Status</SelectItem>
                                                <SelectItem value="pending" className="hover:bg-gray-200">Pending</SelectItem>
                                                <SelectItem value="confirmed" className="hover:bg-gray-200">Confirmed</SelectItem>
                                                <SelectItem value="cancelled" className="hover:bg-gray-200">Cancelled</SelectItem>
                                                <SelectItem value="completed" className="hover:bg-gray-200">Completed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                                            <SelectTrigger className="w-40">
                                                <SelectValue placeholder="Payment" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white">
                                                <SelectItem className="hover:bg-gray-200" value="all">All Payment</SelectItem>
                                                <SelectItem className="hover:bg-gray-200" value="paid">Paid</SelectItem>
                                                <SelectItem className="hover:bg-gray-200" value="remaining">Partial</SelectItem>
                                                <SelectItem className="hover:bg-gray-200" value="unpaid">Unpaid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={sortByFilter} onValueChange={setSortByFilter}>
                                            <SelectTrigger className="w-40">
                                                <SelectValue placeholder="Sort By" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white">
                                                <SelectItem className="hover:bg-gray-200" value="newest">Newest First</SelectItem>
                                                <SelectItem className="hover:bg-gray-200" value="oldest">Oldest First</SelectItem>
                                                <SelectItem className="hover:bg-gray-200" value="highest">Highest Amount</SelectItem>
                                                <SelectItem className="hover:bg-gray-200" value="lowest">Lowest Amount</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : !bookingsData || bookingsData.bookings.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-700">No bookings found</h3>
                                        <p className="text-gray-500">
                                            {searchTerm || statusFilter !== "all" || paymentStatusFilter !== "all" || sortByFilter !== "newest"
                                                ? "Try adjusting your search, filter, or sort criteria"
                                                : "No bookings have been made for this event yet"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                        <th className="px-4 py-3">Business</th>
                                                        <th className="px-4 py-3">Amount</th>
                                                        <th className="px-4 py-3">Payment</th>
                                                        <th className="px-4 py-3">Status</th>
                                                        <th className="px-4 py-3">Type</th>
                                                        <th className="px-4 py-3">Created</th>
                                                        <th className="px-4 py-3">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {bookingsData.bookings.map((booking) => (
                                                        <tr key={booking._id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <Avatar className="h-8 w-8 mr-3">
                                                                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                                                            {getInitials(booking.businessInfo.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="font-medium text-gray-900">{booking.businessInfo.name}</div>
                                                                        <div className="text-xs text-gray-500">
                                                                            ID: {booking.bookingId.substring(0, 12)}...
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                {booking.totalAmount ? (
                                                                    <span className="font-medium text-blue-600">
                                                                        {formatCurrency(booking.totalAmount)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                {getPaymentStatusBadge(booking.paymentStatus)}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(booking.status)}</td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                {booking.isHold ? (
                                                                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                                                                        Hold
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                                                                        Book
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {formatDate(booking.createdAt)}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => navigate(`/admin/bookings/${booking.bookingId}`)}
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
                                            {bookingsData.bookings.map((booking) => (
                                                <Card key={booking._id} className="border border-gray-200">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center">
                                                                <Avatar className="h-10 w-10 mr-3">
                                                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                                                        {getInitials(booking.businessInfo.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <h3 className="font-medium">{booking.businessInfo.name}</h3>
                                                                    <p className="text-sm text-gray-500">{booking.eventName || '-'}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end space-y-1">
                                                                {getStatusBadge(booking.status)}
                                                                {booking.isHold && (
                                                                    <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs">
                                                                        Hold
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Stall:</span>
                                                                <span className="flex items-center">
                                                                    <Store className="h-3 w-3 mr-1" />
                                                                    {booking.stallName || '-'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Amount:</span>
                                                                <span className="font-medium text-blue-600">
                                                                    {booking.totalAmount ? formatCurrency(booking.totalAmount) : "-"}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Payment:</span>
                                                                {getPaymentStatusBadge(booking.paymentStatus)}
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Created:</span>
                                                                <span>{formatDate(booking.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 pt-3 border-t">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full"
                                                                onClick={() => navigate(`/admin/bookings/${booking.bookingId}`)}
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View Details
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>

                                        {/* Pagination Controls */}
                                        <div className="pt-6 border-t">
                                            <PaginationControls
                                                currentPage={bookingsData?.pagination.currentPage || 1}
                                                totalPages={bookingsData?.pagination.totalPages || 1}
                                                hasNext={bookingsData?.pagination.hasNextPage || false}
                                                hasPrev={bookingsData?.pagination.hasPrevPage || false}
                                                totalCount={bookingsData?.pagination.totalBookings || 0}
                                                limit={bookingsData?.pagination.limit || 10}
                                                onPageChange={(page) => setCurrentPage(page)}
                                            />
                                        </div>
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