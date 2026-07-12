// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { AdminSidebar } from "@/components/Sidebar";
// import AdminDashboardSkeleton from "@/components/DashboardSkeleton";
// import { notifyError, notifySuccess } from "@/components/toast";
// import {
//     getDashboardData,
//     getPendingTickets,
//     getRecentRegistrations,
//     getUpcomingEvents,
// } from "@/services/dashboardServices";
// import { approveTicketByAdmin } from "@/services/ticketServices";
// // Import all the new components
// import { DashboardHeader } from "./DashboardHeader";
// import { MetricsCards } from "./MetricsCards";
// import { EventTicketChart } from "./EventTicketChart";
// import { UpcomingEventsCard } from "./UpcomingEventsCard";
// import { PendingTicketsCard } from "./PendingTicketsCard";
// import { RecentRegistrationsCard } from "./RecentRegistrationsCard";

// export default function AdminDashboard() {
//     const navigate = useNavigate();
//     const [error, setError] = useState(false);
//     const [dashboardData, setDashboardData] = useState<any>();
//     const [loading, setLoading] = useState(true);

//     // Pagination states
//     const [pendingTicketsPage, setPendingTicketsPage] = useState(1);
//     const [pendingTicketsData, setPendingTicketsData] = useState<any>();
//     const [pendingTicketsLoading, setPendingTicketsLoading] = useState(false);

//     const [recentRegistrationsPage, setRecentRegistrationsPage] = useState(1);
//     const [recentRegistrationsData, setRecentRegistrationsData] = useState<any>();
//     const [recentRegistrationsLoading, setRecentRegistrationsLoading] = useState(false);

//     const [upcomingEventsPage, setUpcomingEventsPage] = useState(1);
//     const [upcomingEventsData, setUpcomingEventsData] = useState<any>();
//     const [upcomingEventsLoading, setUpcomingEventsLoading] = useState(false);

//     // Fetch main dashboard data
//     const fetchDashboardData = async () => {
//         try {
//             setLoading(true);
//             const response = await getDashboardData();
//             setDashboardData(response.data);
//             setError(false);
//         } catch (err) {
//             console.error("Error fetching dashboard data:", err);
//             setError(true);
//             notifyError("Failed to load dashboard data");
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Fetch pending tickets with pagination
//     const fetchPendingTickets = async (page: number = 1) => {
//         try {
//             setPendingTicketsLoading(true);
//             const response = await getPendingTickets(page);
//             setPendingTicketsData(response.data);
//         } catch (err) {
//             console.error("Error fetching pending tickets:", err);
//             notifyError("Failed to load pending tickets");
//         } finally {
//             setPendingTicketsLoading(false);
//         }
//     };

//     // Fetch recent registrations with pagination
//     const fetchRecentRegistrations = async (page: number = 1) => {
//         try {
//             setRecentRegistrationsLoading(true);
//             const response = await getRecentRegistrations(page);
//             setRecentRegistrationsData(response.data);
//         } catch (err) {
//             console.error("Error fetching recent registrations:", err);
//             notifyError("Failed to load recent registrations");
//         } finally {
//             setRecentRegistrationsLoading(false);
//         }
//     };

//     // Fetch upcoming events with pagination
//     const fetchUpcomingEvents = async (page: number = 1) => {
//         try {
//             setUpcomingEventsLoading(true);
//             const response = await getUpcomingEvents(page);
//             setUpcomingEventsData(response.data);
//         } catch (err) {
//             console.error("Error fetching upcoming events:", err);
//             notifyError("Failed to load upcoming events");
//         } finally {
//             setUpcomingEventsLoading(false);
//         }
//     };

//     // Handle ticket approval
//     const handleTicketApproval = async (ticketId: string) => {
//         try {
//             await approveTicketByAdmin(ticketId);
//             notifySuccess("Ticket approved successfully");
//             // Refresh pending tickets after approval
//             fetchPendingTickets(pendingTicketsPage);
//             // Refresh dashboard data to update metrics
//             fetchDashboardData();
//         } catch (err) {
//             console.error("Error approving ticket:", err);
//             notifyError("Failed to approve ticket");
//         }
//     };

//     // Handle pending tickets pagination
//     const handlePendingTicketsPageChange = (newPage: number) => {
//         setPendingTicketsPage(newPage);
//         fetchPendingTickets(newPage);
//     };

//     // Handle recent registrations pagination
//     const handleRecentRegistrationsPageChange = (newPage: number) => {
//         setRecentRegistrationsPage(newPage);
//         fetchRecentRegistrations(newPage);
//     };

//     // Handle upcoming events pagination
//     const handleUpcomingEventsPageChange = (newPage: number) => {
//         setUpcomingEventsPage(newPage);
//         fetchUpcomingEvents(newPage);
//     };

//     // Initial data fetch
//     useEffect(() => {
//         fetchDashboardData();
//         fetchPendingTickets(1);
//         fetchRecentRegistrations(1);
//         fetchUpcomingEvents(1);
//     }, []);

//     // Handle refresh functionality
//     const handleRefresh = () => {
//         fetchDashboardData();
//         fetchPendingTickets(pendingTicketsPage);
//         fetchRecentRegistrations(recentRegistrationsPage);
//         fetchUpcomingEvents(upcomingEventsPage);
//     };

//     if (loading && !dashboardData) {
//         return <AdminDashboardSkeleton />;
//     }

//     if (error && !dashboardData) {
//         return (
//             <div className="flex min-h-screen">
//                 <AdminSidebar />
//                 <div className="flex-1 p-8">
//                     <div className="text-center">
//                         <h2 className="text-2xl font-bold text-red-600 mb-4">
//                             Error Loading Dashboard
//                         </h2>
//                         <p className="text-gray-600 mb-4">
//                             Failed to load dashboard data. Please try again.
//                         </p>
//                         <button
//                             onClick={handleRefresh}
//                             className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
//                         >
//                             Retry
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="flex min-h-screen bg-gray-50">
//             <AdminSidebar />

//             <div className="flex-1 overflow-auto">
//                 <div className="p-6 space-y-6">
//                     {/* Dashboard Header */}
//                     <DashboardHeader onRefresh={handleRefresh} />

//                     {/* Metrics Cards */}
//                     <MetricsCards data={dashboardData} />

//                     {/* Charts Section */}
//                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                         <EventTicketChart data={dashboardData} />
//                     </div>

//                     {/* Tabbed Content */}
//                     <Tabs defaultValue="overview" className="space-y-6">
//                         <TabsList className="grid w-full grid-cols-4">
//                             <TabsTrigger value="overview">Overview</TabsTrigger>
//                             <TabsTrigger value="tickets">Pending Tickets</TabsTrigger>
//                             <TabsTrigger value="registrations">Recent Registrations</TabsTrigger>
//                             <TabsTrigger value="events">Upcoming Events</TabsTrigger>
//                         </TabsList>

//                         <TabsContent value="overview" className="space-y-6">
//                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                                 {/* Upcoming Events Preview */}
//                                 <UpcomingEventsCard
//                                     data={upcomingEventsData}
//                                     loading={upcomingEventsLoading}
//                                     currentPage={upcomingEventsPage}
//                                     onPageChange={handleUpcomingEventsPageChange}
//                                     preview={true}
//                                 />

//                                 {/* Pending Tickets Preview */}
//                                 <PendingTicketsCard
//                                     tickets={pendingTicketsData}
//                                     loading={pendingTicketsLoading}
//                                     currentPage={pendingTicketsPage}
//                                     onPageChange={handlePendingTicketsPageChange}
//                                     onApprove={handleTicketApproval}
//                                     preview={true}
//                                 />

//                                 {/* Recent Registrations Preview */}
//                                 <RecentRegistrationsCard
//                                     data={recentRegistrationsData}
//                                     loading={recentRegistrationsLoading}
//                                     currentPage={recentRegistrationsPage}
//                                     onPageChange={handleRecentRegistrationsPageChange}
//                                     preview={true}
//                                 />
//                             </div>
//                         </TabsContent>

//                         <TabsContent value="tickets">
//                             <PendingTicketsCard
//                                 tickets={pendingTicketsData}
//                                 loading={pendingTicketsLoading}
//                                 currentPage={pendingTicketsPage}
//                                 onPageChange={handlePendingTicketsPageChange}
//                                 onApprove={handleTicketApproval}
//                                 preview={false}
//                             />
//                         </TabsContent>

//                         <TabsContent value="registrations">
//                             <RecentRegistrationsCard
//                                 data={recentRegistrationsData}
//                                 loading={recentRegistrationsLoading}
//                                 currentPage={recentRegistrationsPage}
//                                 onPageChange={handleRecentRegistrationsPageChange}
//                                 preview={false}
//                             />
//                         </TabsContent>

//                         <TabsContent value="events">
//                             <UpcomingEventsCard
//                                 events={upcomingEventsData}
//                                 loading={upcomingEventsLoading}
//                                 currentPage={upcomingEventsPage}
//                                 onPageChange={handleUpcomingEventsPageChange}
//                                 pagination={upcomingEventsData?.pagination}
//                                 onEventClick={() => {navigate("/events/:eventId")}} // Adjust this to your event details route
//                             />
//                         </TabsContent>
//                     </Tabs>
//                 </div>
//             </div>
//         </div>
//     );
// }