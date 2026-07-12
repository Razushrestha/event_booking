"use client"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
    Calendar,
    Check,
    CheckCircle,
    Download,
    Edit,
    Home,
    Mail,
    Phone,
    QrCode,
    Tag,
    Ticket,
    User,
    X,
    XCircle,
    Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import getStatusBadge from "@/components/utils/getStatusBadge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { AdminSidebar } from "@/components/Sidebar"
import formatCurrency from "@/components/utils/formatCurrency"
import formatDate from "@/components/utils/formatDate"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { notifyError, notifySuccess } from "@/components/toast"
import { getTicketById, rejectTicketByAdmin, approveTicketByAdmin, deleteTicket } from "@/services/ticketServices"

interface TicketFeature {
    name: string
    status: boolean
}

interface TicketInfo {
    tierName: string
    price: number
    features: TicketFeature[]
}

interface TicketDetails {
    _id: string
    eventId: string
    eventName: string
    userId: string
    number: string
    email: string
    ticketInfo: TicketInfo
    qr: string | null
    status: "pending" | "approved" | "rejected"
    note: string
    rejectionReason?: string
    ticketId: string
    submittedAt: string
    updatedAt: string
    __v: number
    paymentScreenshot?: string
    attendeeImage?: string | null
}

export default function TicketDetailsPage() {
    const imageURL = import.meta.env.VITE_IMAGE_URL
    const params = useParams()
    const navigate = useNavigate()
    const ticketId = params.ticketId as string
    const [ticket, setTicket] = useState<TicketDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
    const [isAttendeeImageDialogOpen, setIsAttendeeImageDialogOpen] = useState(false)
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [rejectionReason, setRejectionReason] = useState("")
    const [isSubmittingRejection, setIsSubmittingRejection] = useState(false)
    const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false)

    useEffect(() => {
        console.log(ticketId)
        const fetchTicket = async () => {
            try {
                setIsLoading(true)
                const ticketData = await getTicketById(ticketId)
                setTicket(ticketData)
            } catch (error) {
                console.error("Failed to fetch ticket:", error)
                notifyError("Failed to load ticket details")
            } finally {
                setIsLoading(false)
            }
        }
        if (ticketId) {
            fetchTicket()
        }
    }, [ticketId])

    const handleApproveTicket = async () => {
        try {
            const response = await approveTicketByAdmin(ticketId)
            console.log(response)
            if (response?.status !== 200 || !response?.success) {
                throw new Error(response?.data?.message || "Approval failed unexpectedly")
            }
            setTicket((prev) => (prev ? { ...prev, status: "approved" } : null))
            notifySuccess("Ticket approved successfully")
        } catch (error) {
            notifyError("Failed to approve ticket")
        }
    }

    const handleOpenRejectDialog = () => {
        setRejectionReason("")
        setIsRejectDialogOpen(true)
    }

    const handleRejectTicket = async () => {
        if (!rejectionReason.trim()) {
            notifyError("Please provide a reason for rejection")
            return
        }
        setIsSubmittingRejection(true)
        try {
            const response = await rejectTicketByAdmin(ticketId, rejectionReason)
            console.log(response)
            if (response?.status !== 200 || !response?.success) {
                throw new Error(response?.data?.message || "Rejection failed unexpectedly")
            }
            setTicket(prev =>
                prev
                    ? {
                        ...prev,
                        status: "rejected",
                        rejectionReason: rejectionReason,
                        updatedAt: new Date().toISOString(),
                    }
                    : null
            )
            notifySuccess("Ticket rejected successfully")
            setIsRejectDialogOpen(false)
        } catch (error) {
            const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string }
            const message =
                err?.response?.data?.error?.message ||
                err?.message ||
                "Failed to reject ticket due to an unexpected error"
            notifyError(message)
            console.error("Rejection error:", error)
        } finally {
            setIsSubmittingRejection(false)
        }
    }

    const handleOpenDeleteDialog = () => {
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteTicket = async () => {
        setIsSubmittingDeletion(true)
        try {
            const response = await deleteTicket(ticketId)
            console.log(response)
            if (response?.status !== 200 || !response?.success) {
                throw new Error(response?.data?.message || "Deletion failed unexpectedly")
            }
            notifySuccess("Ticket deleted successfully")
            setIsDeleteDialogOpen(false)
            navigate("/admin/tickets")
        } catch (error) {
            const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string }
            const message =
                err?.response?.data?.error?.message ||
                err?.message ||
                "Failed to delete ticket due to an unexpected error"
            notifyError(message)
            console.error("Deletion error:", error)
        } finally {
            setIsSubmittingDeletion(false)
        }
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
                        <h2 className="text-lg font-medium">Ticket Details</h2>
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
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : ticket ? (
                        <div className="max-w-6xl mx-auto space-y-6">
                            {/* Ticket Header */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-2xl font-bold">Ticket #{ticket.ticketId.substring(0, 8)}</h1>
                                    <div className="text-gray-600">
                                        Submitted on {formatDate(ticket.submittedAt)} • {getStatusBadge(ticket.status)}
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    {ticket.status === "pending" && (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="border-red-500 text-red-500 hover:bg-red-50"
                                                onClick={handleOpenRejectDialog}
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Reject
                                            </Button>
                                            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleApproveTicket}>
                                                <Check className="h-4 w-4 mr-2" />
                                                Approve
                                            </Button>
                                        </>
                                    )}
                                    {ticket.status !== "pending" && (
                                        <Button variant="outline" onClick={() => navigate(`/admin/tickets/${ticket.ticketId}/edit`)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="border-red-600 text-red-600 hover:bg-red-50"
                                        onClick={handleOpenDeleteDialog}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Event Information */}
                                <Card className="border-none shadow-lg md:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                                            Event Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-medium">{ticket.eventName}</h3>
                                            <p className="text-sm text-gray-600">Event ID: {ticket.eventId}</p>
                                        </div>
                                        <Separator />
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Ticket Categories</h4>
                                                <p className="font-medium">{ticket.ticketInfo.tierName}</p>
                                                <p className="text-blue-600 font-medium">{formatCurrency(ticket.ticketInfo.price)}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Features</h4>
                                                <ul className="mt-2 space-y-2">
                                                    {ticket.ticketInfo.features.map((feature, index) => (
                                                        <li key={index} className="flex items-center">
                                                            {feature.status ? (
                                                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                                            ) : (
                                                                <XCircle className="h-4 w-4 text-gray-400 mr-2" />
                                                            )}
                                                            <span>{feature.name}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                {/* User Information */}
                                <Card className="border-none shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <User className="h-5 w-5 mr-2 text-blue-600" />
                                            User Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center">
                                            <Avatar className="h-10 w-10 mr-3">
                                                <AvatarFallback>{ticket.email.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">User</p>
                                                <p className="text-sm text-gray-600">ID: {ticket.userId.substring(0, 8)}...</p>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="space-y-3">
                                            <div className="flex items-start">
                                                <Mail className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Email</h4>
                                                    <p>{ticket.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start">
                                                <Phone className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                                                    <p>{ticket.number}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                {/* Payment Information */}
                                <Card className="border-none shadow-lg md:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Tag className="h-5 w-5 mr-2 text-blue-600" />
                                            Payment Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Amount</h4>
                                                <p className="text-xl font-medium text-blue-600">{formatCurrency(ticket.ticketInfo.price)}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                                                <div className="text-xl font-medium">{getStatusBadge(ticket.status)}</div>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Payment Screenshot</h4>
                                            {ticket.paymentScreenshot ? (
                                                <div
                                                    className="relative aspect-[4/3] max-w-md overflow-hidden rounded-lg border border-gray-200 cursor-pointer"
                                                    onClick={() => setIsImageDialogOpen(true)}
                                                >
                                                    <img
                                                        src={imageURL + ticket.paymentScreenshot || "/placeholder.svg"}
                                                        alt="Payment screenshot"
                                                        className="object-cover w-full h-full"
                                                    />
                                                    <div className="absolute inset-0 bg-gray-500 opacity-30 hover:opacity-10 flex items-center justify-center transition-all">
                                                        <span className="text-white bg-black opacity-100 px-3 py-1 rounded-full text-sm">
                                                            Click to view
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
                                                    No payment screenshot provided
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                                {/* Attendee Image */}
                                <Card className="border-none shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <User className="h-5 w-5 mr-2 text-blue-600" />
                                            Attendee Image
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {ticket.attendeeImage ? (
                                            <div
                                                className="relative aspect-[4/3] max-w-md overflow-hidden rounded-lg border border-gray-200 cursor-pointer"
                                                onClick={() => setIsAttendeeImageDialogOpen(true)}
                                            >
                                                <img
                                                    src={imageURL + ticket.attendeeImage || "/placeholder.svg"}
                                                    alt="Attendee image"
                                                    className="object-cover w-full h-full"
                                                />
                                                <div className="absolute inset-0 bg-gray-500 opacity-30 hover:opacity-10 flex items-center justify-center transition-all">
                                                    <span className="text-white bg-black opacity-100 px-3 py-1 rounded-full text-sm">
                                                        Click to view
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
                                                No attendee image provided
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                                {/* QR Code Section - Only visible for approved tickets */}
                                <Card className="border-none shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <QrCode className="h-5 w-5 mr-2 text-blue-600" />
                                            Ticket QR Code
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {ticket.status === "approved" ? (
                                            <div className="flex flex-col items-center">
                                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                                    <img
                                                        src={ticket.qr ? imageURL + ticket.qr : "/placeholder.svg"}
                                                        alt="Ticket QR Code"
                                                        className="w-48 h-48 object-contain"
                                                    />
                                                </div>
                                                <p className="text-sm text-center mt-3 text-gray-600">
                                                    Scan this QR code for entry to the event
                                                </p>
                                                <Button variant="outline" size="sm" className="mt-3">
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download QR Code
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <QrCode className="h-12 w-12 text-gray-300 mb-3" />
                                                <p className="text-gray-500">
                                                    {ticket.status === "pending"
                                                        ? "QR code will be available once the ticket is approved"
                                                        : "This ticket has been rejected and no QR code is available"}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                                {/* Notes & History */}
                                <Card className="border-none shadow-lg md:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Ticket className="h-5 w-5 mr-2 text-blue-600" />
                                            Ticket Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Ticket ID</h4>
                                                <p className="font-mono">{ticket.ticketId}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Submitted At</h4>
                                                <p>{formatDate(ticket.submittedAt)}</p>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                                            {ticket.note ? (
                                                <p className="text-gray-700">{ticket.note}</p>
                                            ) : (
                                                <p className="text-gray-500 italic">No notes added</p>
                                            )}
                                        </div>
                                        {ticket.status === "rejected" && ticket.rejectionReason && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <h4 className="text-sm font-medium text-red-500">Rejection Reason</h4>
                                                    <p className="text-gray-700 mt-1 p-3 bg-red-50 rounded-md border border-red-100">
                                                        {ticket.rejectionReason}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            {/* Actions */}
                            <div className="flex justify-end space-x-4">
                                <Button variant="outline" onClick={() => navigate("/admin/tickets")}>
                                    Back to Tickets
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-blue-500 text-blue-500 hover:bg-blue-50"
                                    onClick={() => {
                                        notifySuccess("Ticket download started")
                                    }}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Ticket
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                            <h3 className="text-xl font-medium text-gray-700">Ticket not found</h3>
                            <p className="text-gray-500 mt-2">The ticket you're looking for doesn't exist or has been removed.</p>
                            <Button className="mt-4" onClick={() => navigate("/admin/tickets")}>
                                Back to Tickets
                            </Button>
                        </div>
                    )}
                </main>
            </div>
            {/* Image Dialog */}
            <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                <DialogContent className="max-w-4xl bg-slate-200">
                    <DialogHeader>
                        <DialogTitle>Payment Screenshot</DialogTitle>
                        <DialogDescription>Submitted on {ticket ? formatDate(ticket.submittedAt) : ""}</DialogDescription>
                    </DialogHeader>
                    <div className="overflow-auto max-h-[80vh]">
                        {ticket?.paymentScreenshot && (
                            <img
                                src={imageURL + ticket.paymentScreenshot || "/placeholder.svg"}
                                alt="Payment screenshot"
                                className="w-full h-auto object-contain"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            {/* Attendee Image Dialog */}
            <Dialog open={isAttendeeImageDialogOpen} onOpenChange={setIsAttendeeImageDialogOpen}>
                <DialogContent className="max-w-4xl bg-slate-200">
                    <DialogHeader>
                        <DialogTitle>Attendee Image</DialogTitle>
                        <DialogDescription>Submitted on {ticket ? formatDate(ticket.submittedAt) : ""}</DialogDescription>
                    </DialogHeader>
                    <div className="overflow-auto max-h-[80vh]">
                        {ticket?.attendeeImage && (
                            <img
                                src={imageURL + ticket.attendeeImage || "/placeholder.svg"}
                                alt="Attendee image"
                                className="w-full h-auto object-contain"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            {/* Rejection Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent className="bg-slate-100">
                    <DialogHeader>
                        <DialogTitle>Reject Ticket</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this ticket. This will be visible to the user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="rejectionReason">Rejection Reason</Label>
                            <Textarea
                                id="rejectionReason"
                                placeholder="Enter the reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="min-h-[100px] bg-gray-100"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isSubmittingRejection}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectTicket}
                            disabled={isSubmittingRejection || !rejectionReason.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isSubmittingRejection ? "Rejecting..." : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-slate-100">
                    <DialogHeader>
                        <DialogTitle>Delete Ticket</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this ticket? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmittingDeletion}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteTicket}
                            disabled={isSubmittingDeletion}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isSubmittingDeletion ? "Deleting..." : "Confirm Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}