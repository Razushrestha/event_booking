import { Ticket, Clock } from "lucide-react";
import { Card, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import type { DashboardMetrics } from "./types.tsx";

/**
 * Props for MetricsCards component
 * @param metrics - Dashboard metrics data containing revenue, tickets, and pending tickets counts
 */
interface MetricsCardsProps {
    metrics: DashboardMetrics;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics }) => {
    return (
        <div className="flex flex-row lg:flex-col gap-4 lg:gap-6 lg:w-64 lg:flex-none">
            <Card className="border-none shadow-lg flex-1 lg:flex-none">
                <CardHeader className="pb-2">
                    <CardDescription>Total Revenue</CardDescription>
                    <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center">
                        <span className="text-blue-500">Rs.</span>{metrics.totalRevenue?.toLocaleString() || "0"}
                    </CardTitle>
                </CardHeader>
            </Card>

            <Card className="border-none shadow-lg flex-1 lg:flex-none">
                <CardHeader className="pb-2">
                    <CardDescription>Total Tickets</CardDescription>
                    <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center">
                        <Ticket className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mr-1" />
                        {metrics.totalTickets?.toLocaleString() || "0"}
                    </CardTitle>
                </CardHeader>
            </Card>

            <Card className="border-none shadow-lg flex-1 lg:flex-none">
                <CardHeader className="pb-2">
                    <CardDescription>Pending Tickets</CardDescription>
                    <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center">
                        <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 mr-1" />
                        {metrics.pendingTickets?.toLocaleString() || "0"}
                    </CardTitle>
                </CardHeader>
            </Card>
        </div>
    );
};
