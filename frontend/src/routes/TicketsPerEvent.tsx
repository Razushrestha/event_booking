import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Home,
    Search,
    Filter,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    Ticket,
    Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminSidebar } from "@/components/Sidebar";
import PaginationControls from "@/components/AdminDashboard.tsx/PaginationControls";
import { notifyError } from "@/components/toast";
import { getTicketsByEventId } from "@/services/ticketServices";
import formatCurrency from "@/components/utils/formatCurrency";
import getStatusBadge from "@/components/utils/getStatusBadge";
import { exportTicketsCSV } from "@/services/ticketServices";
interface TicketFeature {
    name: string;
    status: boolean;
}

interface TicketInfo {
    tierName: string;
    price: number;
    features: TicketFeature[];
}

interface TicketData {
    _id: string;
    eventId: string;
    name: string;
    eventName: string;
    userId: string;
    ticketInfo: TicketInfo;
    status: "pending" | "approved" | "rejected";
    ticketId: string;
    createdAt?: string;
}

interface Pagination {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextPage: number | null;
    prevPage: number | null;
}

interface Filters {
    status: string | null;
    search: string | null;
    sortBy: string;
    sortOrder: string;
}

interface EventDetails {
    eventId: string;
    eventName: string;
    description: string;
}

interface TicketsResponse {
    tickets: TicketData[];
    eventDetails: EventDetails;
    pagination: Pagination;
    filters: Filters;
    metrics: {
        totalRevenue: number;
        totalTickets: number;
        pending: number;
        approved: number;
        rejected: number;
    };
}

export default function EventTicketsDashboard() {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>();
    const [ticketsData, setTicketsData] = useState<TicketsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch data from backend with filters and pagination
    useEffect(() => {
        const fetchData = async () => {
            if (!eventId) {
                notifyError("Event ID is missing");
                return;
            }
            try {
                setIsLoading(true);
                const response = await getTicketsByEventId({
                    eventId,
                    page: currentPage,
                    status: statusFilter === "all" ? undefined : statusFilter,
                    search: searchTerm || undefined,
                    sortBy: 'createdAt'
                });
                console.log("API Response:", response);
                setTicketsData(response);
            } catch (error) {
                console.error("Failed to fetch tickets:", error);
                notifyError(`Failed to load tickets for event ${eventId}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [eventId, currentPage, statusFilter, searchTerm]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, searchTerm]);

    const getInitials = (name?: string) => {
        if (!name || typeof name !== "string") return "NA";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleDownloadTickets = async (eventId: string) => {
        try {
            const csvData = await exportTicketsCSV(eventId);
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const eventName = ticketsData?.eventDetails.eventName || "Event";
            const sanitizedEventName = eventName.replace(/[^a-zA-Z0-9]/g, '_');
            const a = document.createElement('a');
            a.href = url;
            const now = new Date();
            const localDateTime = now
                .toISOString()
                .replace(/[-:]/g, "")
                .replace("T", "_")
                .slice(0, 15); // e.g., 20240607_1530
            a.download = `Tickets_${sanitizedEventName}_${localDateTime}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); // Clean up the URL object
        } catch (error) {
            console.error('Failed to download tickets CSV:', error);
            notifyError('Failed to download tickets CSV');
        }
    };


    const getStatusCounts = () => {
        if (!ticketsData?.metrics) return { total: 0, pending: 0, approved: 0, rejected: 0 };
        return {
            total: ticketsData.metrics.totalTickets || 0,
            pending: ticketsData.metrics.pending || 0,
            approved: ticketsData.metrics.approved || 0,
            rejected: ticketsData.metrics.rejected || 0,
        };
    };

    const statusCounts = getStatusCounts();

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
                        <h2 className="text-lg font-medium">Event Tickets: {ticketsData?.eventDetails.eventName || "Loading..."}</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 cursor-pointer border-blue-200 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                            onClick={() => eventId && handleDownloadTickets(eventId)}
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
                        {/* Stats Cards */}
                        <div className="grid gap-6 md:grid-cols-4">
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>Total Tickets</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <Ticket className="h-6 w-6 text-blue-500 mr-1" />
                                        {isLoading ? (
                                            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                        ) : (
                                            statusCounts.total
                                        )}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>Pending</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <Clock className="h-6 w-6 text-amber-500 mr-1" />
                                        {isLoading ? (
                                            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                        ) : (
                                            statusCounts.pending
                                        )}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>Approved</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <CheckCircle className="h-6 w-6 text-green-500 mr-1" />
                                        {isLoading ? (
                                            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                        ) : (
                                            statusCounts.approved
                                        )}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>Rejected</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <XCircle className="h-6 w-6 text-red-500 mr-1" />
                                        {isLoading ? (
                                            <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                                        ) : (
                                            statusCounts.rejected
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
                                        <CardTitle>Event Tickets</CardTitle>
                                        <CardDescription>Manage tickets for {ticketsData?.eventDetails.eventName || "the event"}</CardDescription>
                                    </div>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        <div className="relative flex-1 sm:w-80">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                placeholder="Search tickets..."
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
                                                <SelectItem value="pending" className="hover:bg-gray-100">Pending</SelectItem>
                                                <SelectItem value="approved" className="hover:bg-gray-100">Approved</SelectItem>
                                                <SelectItem value="rejected" className="hover:bg-gray-100">Rejected</SelectItem>
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
                                ) : !ticketsData || ticketsData.tickets.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-700">No tickets found</h3>
                                        <p className="text-gray-500">
                                            {searchTerm || statusFilter !== "all"
                                                ? "Try adjusting your search or filter criteria"
                                                : "No tickets have been submitted for this event"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                        <th className="px-4 py-3">User</th>
                                                        <th className="px-4 py-3">Tier</th>
                                                        <th className="px-4 py-3">Price</th>
                                                        <th className="px-4 py-3">Status</th>
                                                        <th className="px-4 py-3">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {ticketsData.tickets.map((ticket) => (
                                                        <tr key={ticket._id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <Avatar className="h-8 w-8 mr-3">
                                                                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                                                            {getInitials(ticket.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="font-medium text-gray-900">{ticket.name}</div>
                                                                        <div className="text-xs text-gray-500">ID: {ticket.userId.substring(0, 8)}...</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <Badge variant="outline">{ticket.ticketInfo.tierName}</Badge>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap font-medium text-blue-600">
                                                                {formatCurrency(ticket.ticketInfo.price)}
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">{getStatusBadge(ticket.status)}</td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => navigate(`/admin/tickets/${ticket.ticketId}`)}
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
                                            {ticketsData.tickets.map((ticket) => (
                                                <Card key={ticket._id} className="border border-gray-200">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center">
                                                                <Avatar className="h-10 w-10 mr-3">
                                                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                                                        {getInitials(ticket.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <h3 className="font-medium">{ticket.name}</h3>
                                                                    <p className="text-sm text-gray-500">{ticket.eventName}</p>
                                                                </div>
                                                            </div>
                                                            {getStatusBadge(ticket.status)}
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Tier:</span>
                                                                <Badge variant="outline">{ticket.ticketInfo.tierName}</Badge>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">Price:</span>
                                                                <span className="font-medium text-blue-600">
                                                                    {formatCurrency(ticket.ticketInfo.price)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 pt-3 border-t">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full"
                                                                onClick={() => navigate(`/admin/tickets/${ticket.ticketId}`)}
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
                                        {ticketsData.pagination.totalPages > 1 && (
                                            <div className="border-t pt-4">
                                                <PaginationControls
                                                    currentPage={ticketsData.pagination.currentPage}
                                                    totalPages={ticketsData.pagination.totalPages}
                                                    hasNext={ticketsData.pagination.hasNext}
                                                    hasPrev={ticketsData.pagination.hasPrev}
                                                    onPageChange={handlePageChange}
                                                    totalCount={ticketsData.pagination.totalCount}
                                                    limit={ticketsData.pagination.limit}
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
    );
}