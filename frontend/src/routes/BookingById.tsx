"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
    Eye,
    Calendar,
    Check,
    CheckCircle,
    Clock,
    Download,
    Home,
    Mail,
    Phone,
    QrCode,
    Store,
    Building,
    User,
    X,
    XCircle,
    AlertTriangle,
    CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { AdminSidebar } from "@/components/Sidebar"
import getStatusBadge from "@/components/utils/getStatusBadge"
import formatDate from "@/components/utils/formatDate"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import formatCurrency from "@/components/utils/formatCurrency"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { notifyError, notifySuccess } from "@/components/toast"
import { getBookingByBookingId, confirmBookingByAdmin, cancelBookingByAdmin } from "@/services/bookingServices"
import { approvePayment, rejectPayment, giveDiscountByAdmin } from "@/services/paymentServices"
import { deleteBookingByAdmin } from "@/services/bookingServices"

interface BusinessInfo {
    name: string
    phone: string
    email: string
}

interface ContactPerson {
    name?: string
    phone?: string
    email?: string
}

interface StallInfo {
    stallName: string
    stallType: string
    stallId: string
    rate: number
    sizeInSqFt: number
    upchargeInPercent: number
    _id: string
}

interface Payment {
    paymentId: string
    amount: number
    paymentDate: string
    paymentProof: string
    paymentMethod: string
    status: string
    _id: string
}

interface BookingDetails {
    _id: string
    bookingId: string
    eventId: string
    eventName: string
    stallInfo: StallInfo[]
    userId: string
    isHold: boolean
    holdExpiry?: string
    totalAmount?: number
    pendingAmount?: number
    paymentStatus: "unpaid" | "remaining" | "paid"
    bookingCancelReason?: string
    qr?: string
    paymentProof: string[]
    payments: Payment[]
    status: "pending" | "confirmed" | "cancelled" | "completed"
    businessInfo: BusinessInfo
    contactPerson?: ContactPerson
    createdAt: string
    updatedAt: string
}

const getBookingById = async (bookingId: string): Promise<BookingDetails> => {
    const response = await getBookingByBookingId(bookingId)
    if (response.error) {
        throw new Error(response.error)
    }
    return response as BookingDetails
}

export default function BookingDetailsPage() {
    const serverImageURL = import.meta.env.VITE_IMAGE_URL;
    const params = useParams()
    const navigate = useNavigate()
    const bookingId = params.bookingId as string

    const [booking, setBooking] = useState<BookingDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false)
    const [isPaymentCancelDialogOpen, setIsPaymentCancelDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [paymentCancelNote, setPaymentCancelNote] = useState("")
    const [selectedPaymentId, setSelectedPaymentId] = useState<string>("")
    const [selectedImage, setSelectedImage] = useState<string>("")
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
    const [cancelReason, setCancelReason] = useState("")
    const [isSubmittingCancel, setIsSubmittingCancel] = useState(false)
    const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false)
    const [discountType, setDiscountType] = useState<"flat" | "percentage">("flat")
    const [discountValue, setDiscountValue] = useState("")
    const [isSubmittingDiscount, setIsSubmittingDiscount] = useState(false)

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                setIsLoading(true)
                const bookingData = await getBookingById(bookingId)
                setBooking(bookingData)
            } catch (error) {
                console.error("Failed to fetch booking:", error)
                notifyError("Failed to load booking details")
            } finally {
                setIsLoading(false)
            }
        }

        if (bookingId) {
            fetchBooking()
        }
    }, [bookingId])

    const handleConfirmBooking = async () => {
        try {
            const response = await confirmBookingByAdmin(bookingId)
            if (response.error) {
                throw new Error(response.error)
            }
            notifySuccess("Booking confirmed successfully")
            setBooking((prev) => (prev ? { ...prev, status: "confirmed" } : null))
        } catch (error) {
            notifyError("Failed to confirm booking")
        }
    }
    const handleDeleteBooking = async (bookingId: string) => {
        try {
            const response = await deleteBookingByAdmin(bookingId)
            if (response.error) {
                throw new Error(response.error)
            }
            notifySuccess("Booking deleted successfully")
            // setBooking(null)
            setIsDeleteDialogOpen(false)
            setTimeout(() => {
                navigate("/admin/bookings")
            }, 2000)
        } catch (error) {
            console.log(error)
            notifyError("Failed to delete booking")
        }
    }

    const handleOpenCancelDialog = () => {
        setCancelReason("")
        setIsCancelDialogOpen(true)
    }

    const handleCancelBooking = async () => {
        if (!cancelReason.trim()) {
            notifyError("Please provide a reason for cancellation")
            return
        }

        setIsSubmittingCancel(true)

        try {
            const response = await cancelBookingByAdmin(bookingId, cancelReason)
            if (response.error) {
                throw new Error(response.error)
            }
            setBooking((prev) =>
                prev
                    ? {
                        ...prev,
                        status: "cancelled",
                        bookingCancelReason: cancelReason,
                        updatedAt: new Date().toISOString(),
                    }
                    : null
            )
            notifySuccess("Booking cancelled successfully")
            setIsCancelDialogOpen(false)
        } catch (error) {
            notifyError("Failed to cancel booking")
        } finally {
            setIsSubmittingCancel(false)
        }
    }

    const handleApprovePayment = async (bookingId: string, paymentId: string) => {
        try {
            const response = await approvePayment(bookingId, paymentId)
            if (response.error) {
                throw new Error(response.error)
            }
            notifySuccess("Payment approved successfully")
            setBooking((prev) =>
                prev
                    ? {
                        ...prev,
                        status: "confirmed",
                        payments: prev.payments.map((p) =>
                            p.paymentId === paymentId ? { ...p, status: "approved" } : p
                        ),
                        updatedAt: new Date().toISOString(),
                    }
                    : null
            )
        } catch (error) {
            if (booking?.status !== "pending") {
                notifyError("Payment cannot be approved for confirmed or cancelled bookings")
                return
            }
            notifyError("Failed to approve payment")
        }
    }

    const handleRejectPayment = async (bookingId: string, paymentId: string, paymentCancelNote?: string) => {
        if (booking?.status !== "pending") {
            notifyError("Payment cannot be rejected for confirmed or cancelled bookings")
            return
        }

        try {
            setIsSubmittingCancel(true)
            const response = await rejectPayment(bookingId, paymentId, paymentCancelNote)
            if (response.error) {
                throw new Error(response.error)
            }
            notifySuccess("Payment rejected successfully")
            setBooking((prev) =>
                prev
                    ? {
                        ...prev,
                        payments: prev.payments.map((p) =>
                            p.paymentId === paymentId ? { ...p, status: "rejected" } : p
                        ),
                        updatedAt: new Date().toISOString(),
                    }
                    : null
            )
            setIsPaymentCancelDialogOpen(false)
            setPaymentCancelNote("")
        } catch (error) {
            notifyError("Failed to reject payment")
        } finally {
            setIsSubmittingCancel(false)
        }
    }

    const openRejectPaymentDialog = (paymentId: string) => {
        setSelectedPaymentId(paymentId)
        setPaymentCancelNote("")
        setIsPaymentCancelDialogOpen(true)
    }

    const handleApplyDiscount = async () => {
        if (!discountValue.trim()) {
            notifyError("Please enter a discount value")
            return
        }

        const discountNum = parseFloat(discountValue)
        if (isNaN(discountNum) || discountNum < 0) {
            notifyError("Please enter a valid non-negative number")
            return
        }

        if (discountType === "percentage" && discountNum > 100) {
            notifyError("Percentage discount cannot exceed 100%")
            return
        }

        setIsSubmittingDiscount(true)

        try {
            let discountAmount: number
            if (discountType === "flat") {
                discountAmount = discountNum
            } else {
                if (!booking?.totalAmount) {
                    throw new Error("Total amount is not available")
                }
                discountAmount = (discountNum / 100) * booking.totalAmount
            }

            if (discountAmount > (booking?.totalAmount || 0)) {
                notifyError("Discount cannot exceed the total amount")
                return
            }

            const response = await giveDiscountByAdmin(bookingId, discountAmount)
            notifySuccess(response.message || "Discount applied successfully")
            setBooking((prev) =>
                prev
                    ? {
                        ...prev,
                        totalAmount: (prev.totalAmount || 0) - discountAmount,
                        updatedAt: new Date().toISOString(),
                    }
                    : null
            )
            setIsDiscountDialogOpen(false)
            setDiscountValue("")
        } catch (error) {
            notifyError("Failed to apply discount")
        } finally {
            setIsSubmittingDiscount(false)
        }
    }

    const getPaymentStatusBadge = (paymentStatus: string) => {
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
                        Partial Payment
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

    const getQRCodeUrl = (bookingId: string) => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`BOOKING:${bookingId}`)}`
    }

    const openImageDialog = (imageUrl: string) => {
        setSelectedImage(serverImageURL + imageUrl)
        setIsImageDialogOpen(true)
    }

    const handlePutOnHold = async () => {
        try {
            const holdExpiry = new Date()
            holdExpiry.setDate(holdExpiry.getDate() + 3)
            setBooking((prev) =>
                prev
                    ? {
                        ...prev,
                        isHold: true,
                        holdExpiry: holdExpiry.toISOString(),
                        updatedAt: new Date().toISOString(),
                    }
                    : null
            )
            notifySuccess("Booking put on hold successfully")
        } catch (error) {
            notifyError("Failed to put booking on hold")
        }
    }

    const calculatedDiscount = () => {
        if (!discountValue.trim() || !booking?.totalAmount) return 0
        const discountNum = parseFloat(discountValue)
        if (isNaN(discountNum) || discountNum < 0) return 0
        if (discountType === "flat") return discountNum
        return (discountNum / 100) * booking.totalAmount
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Home className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-medium">Booking Details</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Admin User</span>
                        <Avatar>
                            <AvatarImage src="/placeholder.svg" alt="Admin" />
                            <AvatarFallback>AU</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : booking ? (
                        <div className="max-w-6xl mx-auto space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-2xl font-bold">Booking #{booking.bookingId}</h1>
                                    <div className="text-gray-600">
                                        Created on {formatDate(booking.createdAt)} • {getStatusBadge(booking.status)}
                                        {booking.isHold && (
                                            <Badge variant="outline" className="ml-2 text-orange-600 border-orange-200">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                On Hold
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="flex space-x-3">
                                    {booking.status === "pending" && (
                                        <>
                                            <Button
                                                variant="outline"
                                                className="border-orange-500 text-orange-500 hover:bg-orange-50"
                                                onClick={handlePutOnHold}
                                            >
                                                <Clock className="h-4 w-4 mr-2" />
                                                Put on Hold
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="border-red-500 text-red-500 hover:bg-red-50"
                                                onClick={handleOpenCancelDialog}
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Cancel
                                            </Button>
                                            {
                                                !booking.isHold && booking.holdExpiry && (
                                                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleConfirmBooking}>
                                                        <Check className="h-4 w-4 mr-2" />
                                                        Confirm
                                                    </Button>
                                                )
                                            }
                                        </>
                                    )}
                                    {booking.status !== "completed" && booking.status !== "cancelled" && (
                                        <Button onClick={() => setIsDiscountDialogOpen(true)} className="bg-blue-600 text-white hover:bg-blue-700">
                                            Add Discount
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Event & Stall Information - Full Width */}
                                <Card className="border-none shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                                            Event & Stall Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div onClick={() => navigate(`/events/${booking.eventId}`)} className="cursor-pointer">
                                            <h3 className="text-lg font-medium">{booking.eventName}</h3>
                                            <p className="text-sm text-gray-600">Event ID: {booking.eventId}</p>
                                        </div>

                                        <Separator />

                                        <div className="space-y-4">
                                            <h4 className="text-sm font-medium text-gray-500">Stall Details</h4>
                                            {booking.stallInfo.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-100">
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Stall Name</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Type</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Size (sq ft)</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Rate</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Sub Total</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Upcharge</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">VAT(13%)</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Price</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {booking.stallInfo.map((stall) => {
                                                                const base = (stall.sizeInSqFt * stall.rate);
                                                                const upcharge = parseFloat(((stall.upchargeInPercent / 100) * base).toFixed(2));
                                                                const vat = (0.13 * (base + upcharge));
                                                                console.log(vat)
                                                                const total = parseFloat((base + upcharge + vat).toFixed(2));

                                                                return (
                                                                    <tr key={stall._id} className="border-b">
                                                                        <td className="p-2 flex items-center">
                                                                            <Store className="h-4 w-4 text-gray-400 mr-2" />
                                                                            {stall.stallName}
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <Badge variant="outline">{stall.stallType}</Badge>
                                                                        </td>
                                                                        <td className="p-2">{stall.sizeInSqFt === 1 ? "-" : stall.sizeInSqFt}</td>
                                                                        <td className="p-2">{stall.sizeInSqFt === 1 ? "-" : formatCurrency(stall.rate)}</td>
                                                                        <td className="p-2">{formatCurrency(base)}</td>
                                                                        <td className="p-2">{stall.upchargeInPercent}%</td>
                                                                        <td className="p-2">{formatCurrency(vat)}</td>
                                                                        <td className="p-2">{formatCurrency(total)}</td>
                                                                    </tr>
                                                                );
                                                            })}

                                                            {/* Subtotal Row */}
                                                            <tr className="font-semibold text-gray-800 bg-gray-100">
                                                                <td className="p-2" colSpan={7}>
                                                                    Subtotal
                                                                </td>
                                                                <td className="p-2">
                                                                    {formatCurrency(
                                                                        parseFloat(
                                                                            booking.stallInfo.reduce((acc, stall) => {
                                                                                const base = stall.sizeInSqFt * stall.rate;
                                                                                const upcharge = (stall.upchargeInPercent / 100) * base;
                                                                                const vat = 0.13 * (base + upcharge);
                                                                                return acc + base + upcharge + vat;
                                                                            }, 0).toFixed(2)
                                                                        ))}
                                                                </td>
                                                            </tr>

                                                            {/* Discount Row */}
                                                            <tr className="font-semibold text-gray-800 bg-gray-100">
                                                                <td className="p-2" colSpan={7}>
                                                                    Discount
                                                                </td>
                                                                <td className="p-2">
                                                                    {booking.totalAmount &&
                                                                        booking.totalAmount ===
                                                                        parseFloat(
                                                                            booking.stallInfo.reduce((acc, stall) => {
                                                                                const base = stall.sizeInSqFt * stall.rate;
                                                                                const upcharge = (stall.upchargeInPercent / 100) * base;
                                                                                const vat = 0.13 * (base + upcharge);
                                                                                return acc + base + upcharge + vat;
                                                                            }, 0).toFixed(2)
                                                                        )
                                                                        ? formatCurrency(0)
                                                                        : booking.totalAmount
                                                                            ? formatCurrency(
                                                                                parseFloat(
                                                                                    (
                                                                                        parseFloat(
                                                                                            booking.stallInfo.reduce((acc, stall) => {
                                                                                                const base = stall.sizeInSqFt * stall.rate;
                                                                                                const upcharge = (stall.upchargeInPercent / 100) * base;
                                                                                                const vat = 0.13 * (base + upcharge);
                                                                                                return acc + base + upcharge + vat;
                                                                                            }, 0).toFixed(2)
                                                                                        ) - booking.totalAmount
                                                                                    ).toFixed(2)
                                                                                )
                                                                            )
                                                                            : formatCurrency(0)}
                                                                </td>
                                                            </tr>

                                                            {/* Total Row */}
                                                            <tr className="font-semibold text-gray-800 bg-gray-100">
                                                                <td className="p-2" colSpan={7}>
                                                                    Total
                                                                </td>
                                                                <td className="p-2">
                                                                    {formatCurrency(
                                                                        parseFloat(
                                                                            (
                                                                                booking.totalAmount ||
                                                                                booking.stallInfo.reduce((acc, stall) => {
                                                                                    const base = stall.sizeInSqFt * stall.rate;
                                                                                    const upcharge = (stall.upchargeInPercent / 100) * base;
                                                                                    const vat = 0.13 * (base + upcharge);
                                                                                    return acc + base + upcharge + vat;
                                                                                }, 0)
                                                                            ).toFixed(2)
                                                                        )
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-600">No stalls assigned</p>
                                            )}

                                            {booking.isHold && booking.holdExpiry && (
                                                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                                    <div className="flex items-center">
                                                        <AlertTriangle className="h-4 w-4 text-orange-600 mr-2" />
                                                        <span className="text-sm font-medium text-orange-800">Hold Expires:</span>
                                                    </div>
                                                    <p className="text-sm text-orange-700 mt-1">{formatDate(booking.holdExpiry)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Payment Information - Full Width */}
                                <Card className="border-none shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                                            Payment Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Total Amount</h4>
                                                <p className="text-xl font-medium text-blue-600">
                                                    {booking.totalAmount ? formatCurrency(booking.totalAmount) : "Not specified"}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Pending Amount</h4>
                                                <p className="text-xl font-medium text-blue-600">
                                                    {booking.pendingAmount ? formatCurrency(booking.pendingAmount) : formatCurrency(0)}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Payment Status</h4>
                                                <div className="text-xl font-medium">{getPaymentStatusBadge(booking.paymentStatus)}</div>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Payment Details</h4>
                                            {booking.payments.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-100">
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Amount</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Date</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Method</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Status</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Proof</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {booking.payments.map((payment) => (
                                                                <tr key={payment._id} className="border-b">
                                                                    <td className="p-2">{formatCurrency(payment.amount)}</td>
                                                                    <td className="p-2">{formatDate(payment.paymentDate)}</td>
                                                                    <td className="p-2">{payment.paymentMethod}</td>
                                                                    <td className="p-2">{getStatusBadge(payment.status)}</td>
                                                                    <td className="p-2">
                                                                        {payment.paymentProof ? (
                                                                            <Button
                                                                                variant="link"
                                                                                size="sm"
                                                                                onClick={() => openImageDialog(payment.paymentProof)}
                                                                            >
                                                                                <Eye />
                                                                                View Proof
                                                                            </Button>
                                                                        ) : (
                                                                            <span className="text-gray-500">No Proof</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-2">
                                                                        {payment.status === "pending" && (
                                                                            <div className="flex space-x-2">
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="bg-green-600 text-white hover:bg-green-700"
                                                                                    onClick={() => handleApprovePayment(bookingId, payment.paymentId)}
                                                                                    disabled={booking.status === "cancelled" || booking.status === "completed"}
                                                                                >
                                                                                    Approve
                                                                                </Button>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className="bg-red-600 text-white hover:bg-red-700"
                                                                                    onClick={() => openRejectPaymentDialog(payment.paymentId)}
                                                                                    disabled={booking.status === "cancelled" || booking.status === "completed"}
                                                                                >
                                                                                    Reject
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
                                                    No payment details available
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Business Information and QR Code - Side by Side */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="border-none shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <Building className="h-5 w-5 mr-2 text-blue-600" />
                                                Business Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center">
                                                <Avatar className="h-10 w-10 mr-3">
                                                    <AvatarFallback>{getInitials(booking.businessInfo.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{booking.businessInfo.name}</p>
                                                    <p className="text-sm text-gray-600">Business</p>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="space-y-3">
                                                <div className="flex items-start">
                                                    <Mail className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-500">Email</h4>
                                                        <p>{booking.businessInfo.email}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start">
                                                    <Phone className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                                                    <div>
                                                        <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                                                        <p>{booking.businessInfo.phone}</p>
                                                    </div>
                                                </div>

                                                {booking.contactPerson && (
                                                    <>
                                                        <Separator />
                                                        <div>
                                                            <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Person</h4>
                                                            <div className="space-y-2">
                                                                {booking.contactPerson.name && (
                                                                    <div className="flex items-center">
                                                                        <User className="h-4 w-4 text-gray-400 mr-2" />
                                                                        <span>{booking.contactPerson.name}</span>
                                                                    </div>
                                                                )}
                                                                {booking.contactPerson.email && (
                                                                    <div className="flex items-center">
                                                                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                                                        <span>{booking.contactPerson.email}</span>
                                                                    </div>
                                                                )}
                                                                {booking.contactPerson.phone && (
                                                                    <div className="flex items-center">
                                                                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                                                        <span>{booking.contactPerson.phone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-none shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="flex items-center">
                                                <QrCode className="h-5 w-5 mr-2 text-blue-600" />
                                                Booking QR Code
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {booking.status === "completed" ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="bg-white p-4 rounded-lg shadow-sm">
                                                        <img
                                                            src={booking.qr || getQRCodeUrl(booking.bookingId) || "/placeholder.svg"}
                                                            alt="Booking QR Code"
                                                            className="w-48 h-48 object-contain"
                                                        />
                                                    </div>
                                                    <p className="text-sm text-center mt-3 text-gray-600">
                                                        Scan this QR code for stall access verification
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
                                                        {booking.status === "confirmed"
                                                            ? "QR code will be available once the booking is completed with full payment"
                                                            : "This booking has been cancelled and no QR code is available"}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Booking Details */}
                                <Card className="border-none shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                                            Booking Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Booking ID</h4>
                                                <p className="font-mono">{booking.bookingId}</p>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                                                <p>{formatDate(booking.createdAt)}</p>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                                                <p>{formatDate(booking.updatedAt)}</p>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">User ID</h4>
                                                <p className="font-mono">{booking.userId}</p>
                                            </div>
                                        </div>

                                        {booking.status === "cancelled" && booking.bookingCancelReason && (
                                            <>
                                                <Separator />
                                                <div>
                                                    <h4 className="text-sm font-medium text-red-500">Cancellation Reason</h4>
                                                    <p className="text-gray-700 mt-1 p-3 bg-red-50 rounded-md border border-red-100">
                                                        {booking.bookingCancelReason}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex justify-end space-x-4">
                                <Button variant="outline" onClick={() => navigate("/admin/bookings")}>
                                    Back to Bookings
                                </Button>
                                {/* <Button
                                    variant="outline"
                                    className="border-blue-500 text-blue-500 hover:bg-blue-50"
                                    onClick={() => {
                                        notifySuccess("Booking download started")
                                    }}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Booking
                                </Button> */}
                                <Button variant="outline" className="bg-red-500 text-white hover:text-red-500 hover:bg-red-50" onClick={() => {
                                    setIsDeleteDialogOpen(true)
                                }}>
                                    <X className="h-4 w-4 mr-2" />
                                    Delete Booking
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                            <h3 className="text-xl font-medium text-gray-700">Booking not found</h3>
                            <p className="text-gray-500 mt-2">The booking you're looking for doesn't exist or has been removed.</p>
                            <Button className="mt-4" onClick={() => navigate("/admin/bookings")}>
                                Back to Bookings
                            </Button>
                        </div>
                    )}
                </main>
            </div>

            <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                <DialogContent className="max-w-4xl bg-white">
                    <DialogHeader>
                        <DialogTitle>Payment Detail</DialogTitle>
                        <DialogDescription>Viewing payment proof image</DialogDescription>
                    </DialogHeader>
                    <div className="overflow-auto max-h-[80vh]">
                        <img
                            src={selectedImage || "/placeholder.svg"}
                            alt="Payment proof"
                            className="w-full h-auto object-contain"
                        />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isPaymentCancelDialogOpen} onOpenChange={setIsPaymentCancelDialogOpen}>
                <DialogContent className="bg-slate-100">
                    <DialogHeader>
                        <DialogTitle>Reject Payment</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to reject this payment? Please provide a reason for rejection.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="paymentCancelNote">Rejection Reason</Label>
                            <Textarea
                                id="paymentCancelNote"
                                placeholder="Enter a note for the rejection..."
                                value={paymentCancelNote}
                                onChange={(e) => setPaymentCancelNote(e.target.value)}
                                className="min-h-[100px] bg-gray-200"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPaymentCancelDialogOpen(false)} disabled={isSubmittingCancel}>
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleRejectPayment(bookingId, selectedPaymentId, paymentCancelNote)}
                            disabled={isSubmittingCancel || !paymentCancelNote.trim()}
                            className="bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500"
                        >
                            {isSubmittingCancel ? "Rejecting..." : "Confirm Rejection"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <DialogContent className="bg-slate-100">
                    <DialogHeader>
                        <DialogTitle>Cancel Booking</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for cancelling this booking. This will be visible to the user.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="cancelReason">Cancellation Reason</Label>
                            <Textarea
                                id="cancelReason"
                                placeholder="Enter the reason for cancellation..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="min-h-[100px] bg-gray-200"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} disabled={isSubmittingCancel}>
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCancelBooking}
                            disabled={isSubmittingCancel || !cancelReason.trim()}
                            className="bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500"
                        >
                            {isSubmittingCancel ? "Cancelling..." : "Confirm Cancellation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
                <DialogContent className="bg-slate-100">
                    <DialogHeader>
                        <DialogTitle>Add Discount</DialogTitle>
                        <DialogDescription>
                            Select the discount type and enter the discount value to apply to this booking.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="discountType">Discount Type</Label>
                            <Select value={discountType} onValueChange={(value: "flat" | "percentage") => setDiscountType(value)}>
                                <SelectTrigger id="discountType">
                                    <SelectValue placeholder="Select discount type" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="flat">Flat Discount</SelectItem>
                                    <SelectItem value="percentage">Percentage Discount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discountValue">
                                {discountType === "flat" ? "Discount Amount" : "Discount Percentage"}
                            </Label>
                            <Input
                                id="discountValue"
                                type="number"
                                min="0"
                                step={discountType === "flat" ? "0.01" : "1"}
                                placeholder={discountType === "flat" ? "Enter amount (e.g., 100)" : "Enter percentage (e.g., 10)"}
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                className="bg-gray-200"
                            />
                        </div>
                        {booking?.totalAmount && (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    Current Total: {formatCurrency(booking.pendingAmount || booking.totalAmount || 0)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Discount: {formatCurrency(calculatedDiscount())}
                                </p>
                                <p className="text-sm font-medium">
                                    New Total: {formatCurrency((booking.pendingAmount || 0) - calculatedDiscount())}
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDiscountDialogOpen(false)} disabled={isSubmittingDiscount}>
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleApplyDiscount}
                            disabled={isSubmittingDiscount || !discountValue.trim()}
                            className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                        >
                            {isSubmittingDiscount ? "Applying..." : "Apply Discount"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-red-50">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Delete Booking</DialogTitle>
                        <DialogDescription className="text-red-500">
                            Are you sure you want to delete this booking? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmittingCancel}>
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleDeleteBooking(bookingId)}
                            disabled={isSubmittingCancel}
                            className="bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500"
                        >
                            {isSubmittingCancel ? "Deleting..." : "Confirm Deletion"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}