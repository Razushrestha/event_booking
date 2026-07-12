import { Card, CardDescription, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import type { EventTicketStat } from "./types";
/**
 * Props for EventTicketChart component
 * @param eventTicketStats - Array of event ticket statistics
 */
interface EventTicketChartProps {
    eventTicketStats: EventTicketStat[];
}

export const EventTicketChart: React.FC<EventTicketChartProps> = ({ eventTicketStats }) => {
    const COLORS = {
        approved: "#22c55e",
        pending: "#f59e0b",
        rejected: "#ef4444",
    };

    const prepareChartData = (stats: EventTicketStat[]) => {
        return stats.map((stat) => ({
            eventName: stat.eventName.length > 15 ? stat.eventName.substring(0, 15) + "..." : stat.eventName,
            fullEventName: stat.eventName,
            approved: stat.approved,
            pending: stat.pending,
            rejected: stat.rejected,
            total: stat.total,
        }));
    };

    if (eventTicketStats.length === 0) {
        return (
            <Card className="flex-1 border-none shadow-lg flex flex-col min-h-0">
                <CardHeader className="flex-none">
                    <CardTitle>Event Ticket Statistics</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0">
                    <p className="text-center text-gray-500 flex-1 flex items-center justify-center">
                        No tickets so far
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex-1 border-none shadow-lg flex flex-col min-h-0">
            <CardHeader className="flex-none">
                <CardTitle>Event Ticket Statistics</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
                <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 h-full">
                    {/* Bar Chart */}
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
                                    data={prepareChartData(eventTicketStats)}
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
                                            const data = payload?.[0]?.payload;
                                            return data?.fullEventName || label;
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

                    {/* Summary Cards */}
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 flex-none">
                        {eventTicketStats.map((stat) => (
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
            </CardContent>
        </Card>
    );
};