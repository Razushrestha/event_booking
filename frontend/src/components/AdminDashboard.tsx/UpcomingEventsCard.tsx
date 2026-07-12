import { Calendar, Plus, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UpcomingEvent, PaginationInfo } from "./types";
import PaginationControls from "./PaginationControls";

/**
 * Props for UpcomingEventsCard component
 * @param events - Array of upcoming events
 * @param pagination - Pagination information for events
 * @param currentPage - Current page number
 * @param loading - Loading state indicator
 * @param onPageChange - Callback function when page changes
 * @param onEventClick - Callback function when an event is clicked
 */
interface UpcomingEventsCardProps {
    events: UpcomingEvent[];
    pagination: PaginationInfo;
    currentPage: number;
    loading: boolean;
    onPageChange: (page: number) => void;
    onEventClick: (eventId: string) => void;
}

export const UpcomingEventsCard: React.FC<UpcomingEventsCardProps> = ({
    events,
    pagination,
    currentPage,
    loading,
    onPageChange,
    onEventClick,
}) => {
    return (
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
                {loading ? (
                    <div className="text-center py-8">Loading events...</div>
                ) : events.length > 0 ? (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {events.map((event) => (
                                <Card
                                    key={event.eventId}
                                    className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
                                    onClick={() => onEventClick(event.eventId)}
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
                                            {event.ticketTiers?.slice(0, 3).map((tier) => (
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
                    <p className="text-center text-gray-500 py-8">No upcoming events</p>
                )}
            </CardContent>
        </Card>
    );
};