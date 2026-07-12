import {
  Calendar,
  CheckCircle,
  Clock,
  Home,
  Ticket,
  XCircle,
  Eye,
  Plus
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminSidebar } from "@/components/Sidebar.tsx"
import { useEffect, useState } from "react"
import { getDashboardData } from "@/services/dashboardServices"
import AdminDashboardSkeleton from "@/components/DashboardSkeleton"
import { notifyError, notifySuccess } from "@/components/toast"
import { approveTicketByAdmin } from "@/services/ticketServices"
import formatDate from "@/components/utils/formatDate"
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [error, setError] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>()
  const [loading, setLoading] = useState(true)
  error;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(false)
        const data = await getDashboardData()
        if (!data) {
          notifyError("No data found")
          throw new Error("No data found")
        }
        else {
          console.log(data.eventTicketStats)
          setDashboardData(data)
          console.log(data.pendingTickets)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        setError(true)
        notifyError("Dashboard Data could not be loaded")
      }
    }

    fetchDashboardData()
  }, [])

  const handleApproveTicket = async (ticketId: string) => {
    const response = await approveTicketByAdmin(ticketId)
    if (response.status !== 200) {
      notifyError("Ticket could not be approved")
      return
    }
    const updatedTickets = dashboardData.pendingTickets.filter((ticket: any) => ticket.ticketId !== ticketId)
    setDashboardData((prevData: any) => ({
      ...prevData,
      pendingTickets: updatedTickets,
    }))
    notifySuccess(`Ticket has been approved`)
  }

  if (loading) {
    return (
      <AdminDashboardSkeleton />
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
              <TabsTrigger value="overview" className=" cursor-pointer">Overview</TabsTrigger>
              <TabsTrigger value="tickets" className=" cursor-pointer">Tickets</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Metrics */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-lg">
                  <CardHeader className="pb-2">
                    <CardDescription>Total Revenue</CardDescription>
                    <CardTitle className="text-3xl font-bold flex items-center">
                      {/* <span className="text-blue-500">Rs. </span> */}
                      {dashboardData.metrics.totalRevenue.toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border-none shadow-lg">
                  <CardHeader className="pb-2">
                    <CardDescription>Total Tickets</CardDescription>
                    <CardTitle className="text-3xl font-bold flex items-center">
                      <Ticket className="h-6 w-6 text-blue-500 mr-1" />
                      {dashboardData.metrics.totalTickets.toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border-none shadow-lg">
                  <CardHeader className="pb-2">
                    <CardDescription>Pending Tickets</CardDescription>
                    <CardTitle className="text-3xl font-bold flex items-center">
                      <Clock className="h-6 w-6 text-amber-500 mr-1" />
                      {dashboardData.metrics.pendingTickets.toLocaleString()}
                    </CardTitle>
                  </CardHeader>
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
                  <div className="space-y-4">
                    {dashboardData.upcomingEvents.map((event: any) => (
                      <div
                        key={event.eventId}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100"
                      >
                        <div>
                          <a href={`/events/${event.eventId}`} className="font-medium">{event.title}</a>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(event.startDateTime).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {event.ticketTiers.map((tier: any) => (
                            <Badge key={tier.name} variant="outline">
                              {tier.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Event Ticket Stats */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Event Ticket Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {dashboardData.eventTicketStats.length === 0 ? (
                      <p className="text-center text-gray-500">No tickets so far</p>
                    ) : (
                      dashboardData.eventTicketStats.map((stat: any) => (
                        <div key={stat.eventId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{stat.eventName}</h3>
                            <span className="text-sm text-gray-500">{stat.total} tickets total</span>
                          </div>

                          {/* Approved */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                Approved
                              </span>
                              <span>
                                {stat.approved} ({Math.round((stat.approved / stat.total) * 100)}%)
                              </span>
                            </div>
                            <Progress
                              value={(stat.approved / stat.total) * 100}
                              className="h-2 bg-gray-100 [&>div]:bg-green-500"
                            />
                          </div>

                          {/* Pending */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 text-amber-500 mr-1" />
                                Pending
                              </span>
                              <span>
                                {stat.pending} ({Math.round((stat.pending / stat.total) * 100)}%)
                              </span>
                            </div>
                            <Progress
                              value={(stat.pending / stat.total) * 100}
                              className="h-2 bg-gray-100"
                              indicatorClassName="bg-amber-500"
                            />
                          </div>

                          {/* Rejected */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center">
                                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                                Rejected
                              </span>
                              <span>
                                {stat.rejected} ({Math.round((stat.rejected / stat.total) * 100)}%)
                              </span>
                            </div>
                            <Progress
                              value={(stat.rejected / stat.total) * 100}
                              className="h-2 bg-gray-100"
                              indicatorClassName="bg-red-500"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-6">
              {/* Pending Tickets */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Pending Tickets</CardTitle>
                  <CardDescription>Review and approve ticket registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.pendingTickets.map((ticket: any) => (
                      <div
                        key={ticket.ticketId}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100"
                      >
                        <a href={`/admin/tickets/${ticket.ticketId}`} className="font-medium">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback>{ticket.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{ticket.name}</h3>
                              <p className="text-sm text-gray-500">{ticket.email}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="text-gray-600">{ticket.eventName}</span>
                            <span className="mx-2">•</span>
                            <Badge variant="outline">{ticket.ticketInfo.tierName}</Badge>
                            {/* <div className="mt-1 text-gray-500">Submitted {formatDate(ticket.createdAt)}</div> */}
                          </div>
                        </a>
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
                            className="border-blue-500 text-blue-500 hover:bg-red-50"
                            onClick={() => navigate(`/admin/tickets/${ticket.ticketId}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Registrations */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Recent Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Event</th>
                          <th className="px-4 py-3">Tier</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dashboardData.recentRegistrations.map((registration: any) => (
                          <tr key={registration.ticketId}>
                            <td className="px-4 py-3 whitespace-nowrap">{registration.eventName}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge variant="outline">{registration.ticketInfo.tierName}</Badge>
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
