import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { RecentRegistration, PaginationInfo } from "./types";
import PaginationControls  from "./PaginationControls";
import formatDate from "../utils/formatDate";
/**
 * Props for RecentRegistrationsCard component
 * @param registrations - Array of recent registrations
 * @param pagination - Pagination information for registrations
 * @param currentPage - Current page number
 * @param loading - Loading state indicator
 * @param onPageChange - Callback function when page changes
 */
interface RecentRegistrationsCardProps {
    registrations: RecentRegistration[];
    pagination: PaginationInfo;
    currentPage: number;
    loading: boolean;
    onPageChange: (page: number) => void;
}

export const RecentRegistrationsCard: React.FC<RecentRegistrationsCardProps> = ({
    registrations,
    pagination,
    currentPage,
    loading,
    onPageChange,
}) => {
    return (
        <Card className="border-none shadow-lg">
            <CardHeader>
                <CardTitle>Recent Registrations</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8">Loading recent registrations...</div>
                ) : registrations.length > 0 ? (
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
                                    {registrations.map((registration) => (
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
                    <p className="text-center text-gray-500 py-8">No recent registrations</p>
                )}
            </CardContent>
        </Card>
    );
};
