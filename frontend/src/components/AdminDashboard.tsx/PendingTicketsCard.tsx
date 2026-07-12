import { CheckCircle, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PendingTicket, PaginationInfo } from "./types";
import PaginationControls  from "./PaginationControls";

/**
 * Props for PendingTicketsCard component
 * @param tickets - Array of pending tickets
 * @param pagination - Pagination information for tickets
 * @param currentPage - Current page number
 * @param loading - Loading state indicator
 * @param onPageChange - Callback function when page changes
 * @param onApproveTicket - Callback function when a ticket is approved
 * @param onViewTicket - Callback function when viewing ticket details
 */
interface PendingTicketsCardProps {
    tickets: PendingTicket[];
    pagination: PaginationInfo;
    currentPage: number;
    loading: boolean;
    onPageChange: (page: number) => void;
    onApproveTicket: (ticketId: string) => void;
    onViewTicket: (ticketId: string) => void;
}

export const PendingTicketsCard: React.FC<PendingTicketsCardProps> = ({
    tickets,
    pagination,
    currentPage,
    loading,
    onPageChange,
    onApproveTicket,
    onViewTicket,
}) => {
    const getUserName = (ticket: PendingTicket) => {
        return ticket.name || ticket.userId || "Unknown User";
    };

    return (
        <Card className="border-none shadow-lg">
            <CardHeader>
                <div>
                    <CardTitle>Pending Tickets</CardTitle>
                    <CardDescription>Review and approve ticket registrations</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8">Loading pending tickets...</div>
                ) : tickets.length > 0 ? (
                    <>
                        <div className="space-y-4">
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket.ticketId}
                                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100"
                                >
                                    <div
                                        className="flex items-center flex-1 cursor-pointer"
                                        onClick={() => onViewTicket(ticket.ticketId)}
                                    >
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
                                            onClick={() => onApproveTicket(ticket.ticketId)}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-blue-500 text-blue-500 hover:bg-blue-50"
                                            onClick={() => onViewTicket(ticket.ticketId)}
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            View
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={pagination.totalPages}
                            hasNext={pagination.hasNext}
                            hasPrev={pagination.hasPrev}
                            onPageChange={onPageChange}
                            totalCount={pagination.totalCount}
                            limit={pagination.limit}
                        />
                    </>
                ) : (
                    <p className="text-center text-gray-500 py-8">No pending tickets</p>
                )}
            </CardContent>
        </Card>
    );
};