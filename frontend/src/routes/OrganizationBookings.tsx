import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Building, X, Store, AlertTriangle, Upload, Eye } from "lucide-react";
import Navbar from '@/userComponents/navbar';
import Footer from '@/userComponents/footer';
import { useEffect, useState } from "react";
import { notifyError, notifySuccess } from "@/components/toast";
import axiosInstance from '@/lib/axios';
import { withUploadToken } from "@/lib/uploadUrl";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDropzone } from "react-dropzone";

interface Stall {
    stallName: string;
    stallType: string;
    stallId: string;
    rate: number;
    sizeInSqFt: number;
    upchargeInPercent: number;
    _id: string;
}

interface Payment {
    paymentId: string;
    amount: number;
    paymentDate: string;
    paymentProof: string;
    paymentMethod: string;
    failedNote?: string;
    status: "pending" | "completed" | "failed";
    _id: string;
}

interface Booking {
    _id: string;
    bookingId: string;
    eventId: string;
    eventName: string;
    businessInfo: {
        name: string;
        phone: string;
        email: string;
    };
    contactPerson: {
        name: string;
        phone: string;
        email: string;
    };
    stallInfo: Stall[];
    userId: string;
    isHold: boolean;
    holdExpiry?: string;
    totalAmount: number;
    pendingAmount: number;
    paymentStatus: "unpaid" | "remaining" | "paid";
    paymentProof: string[];
    payments: Payment[];
    status: "pending" | "confirmed" | "cancelled" | "completed";
    bookingCancelReason?: string;
    qr?: string;
    createdAt: string;
    updatedAt: string;
}

interface EventData {
    minimumPaymentPercent: number;
}

const statusBg = (paymentStatus: Booking['paymentStatus']) => {
    if (paymentStatus === 'remaining') return 'bg-orange-50';
    if (paymentStatus === 'paid') return 'bg-green-50';
    if (paymentStatus === 'unpaid') return 'bg-yellow-50';
    return 'bg-white';
};

const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
        case 'completed':
            return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
        case 'failed':
            return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
        case 'pending':
            return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
        default:
            return <Badge>{status}</Badge>;
    }
};

import formatCurrency from "@/components/utils/formatCurrency";

const MyBookings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [paymentForm, setPaymentForm] = useState({
        paidAmount: '',
        paymentMethod: '',
        paymentProof: null as File | null,
    });
    const [amountError, setAmountError] = useState('');
    const [eventData, setEventData] = useState<{ [eventId: string]: EventData }>({});

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
            'application/pdf': ['.pdf'],
        },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setPaymentForm({ ...paymentForm, paymentProof: acceptedFiles[0] });
            }
        },
    });

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get('/bookings/user');
                const sortedBookings = response.data.data.sort((a: Booking, b: Booking) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setBookings(sortedBookings);

                // Fetch minimumPaymentPercent for each unique event
                const uniqueEventIds = [...new Set(sortedBookings.map((booking: Booking) => booking.eventId))];
                const eventPromises = uniqueEventIds.map(eventId =>
                    axiosInstance.get(`/events/${eventId}`).then(res => ({ eventId, data: res.data.data }))
                );
                const eventResults = await Promise.all(eventPromises);
                const eventDataMap = eventResults.reduce((acc, { eventId, data }) => ({
                    ...acc,
                    [String(eventId)]: { minimumPaymentPercent: data.minimumPaymentPercent || 0 }
                }), {});
                setEventData(eventDataMap);

                // Placeholder for admin check (implement based on your auth system)
                // const user = await checkUserRole();
                // setIsAdmin(user.role === 'admin');
            } catch (error) {
                console.error("Failed to fetch bookings or event data:", error);
                notifyError("Failed to load booking details");
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const validateAmount = (amount: string) => {
        if (!selectedBooking) return;
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setAmountError('Please enter a valid amount');
        } else if (numAmount > selectedBooking.pendingAmount) {
            setAmountError(`Amount cannot exceed pending amount of ${formatCurrency(selectedBooking.pendingAmount)}`);
        } else {
            setAmountError('');
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBooking || !paymentForm.paymentProof || amountError) return;

        const formData = new FormData();
        formData.append('bookingId', selectedBooking.bookingId);
        formData.append('paidAmount', paymentForm.paidAmount);
        formData.append('paymentMethod', paymentForm.paymentMethod);
        formData.append('paymentProof', paymentForm.paymentProof);

        try {
            await axiosInstance.post('/payments/add', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            notifySuccess("Payment submitted successfully");
            setIsPaymentDialogOpen(false);
            setPaymentForm({ paidAmount: '', paymentMethod: '', paymentProof: null });
            setSelectedBooking(null);
            setAmountError('');
            // Refresh bookings
            const response = await axiosInstance.get('/bookings/user');
            const sortedBookings = response.data.data.sort((a: Booking, b: Booking) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setBookings(sortedBookings);
        } catch (error) {
            console.error("Failed to submit payment:", error);
            notifyError("Failed to submit payment");
        }
    };

    const openImageDialog = (proofPath: string) => {
        setSelectedImage(withUploadToken(proofPath));
        setIsImageDialogOpen(true);
    };

    if (loading) return <div className="text-center py-20 text-gray-600">Loading your bookings...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <section className="pt-16 pb-8">
                <div className="container mx-auto px-4">
                    <div className="mb-4">
                        <Button
                            variant="outline"
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                            onClick={() => navigate('/')}
                        >
                            <X className="h-4 w-4" />
                            Back to Events
                        </Button>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6">
                        My Bookings
                    </h1>
                    {bookings.length === 0 ? (
                        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                            <p className="text-gray-600 text-base">No bookings found. Book a stall to see your bookings here!</p>
                            <Button
                                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-base font-medium"
                                onClick={() => navigate('/search')}
                            >
                                Explore Events
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {bookings.map((booking) => (
                                <div
                                    key={booking.bookingId}
                                    className={`rounded-xl shadow-md p-6 ${statusBg(booking.paymentStatus)}`}
                                >
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                                                {booking.eventName}
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : booking.paymentStatus === 'unpaid' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'}`}>
                                                {booking.paymentStatus.toUpperCase()}
                                            </div>
                                            {booking.isHold && (
                                                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                                                    ON HOLD
                                                </div>
                                            )}
                                        </div>
                                        {booking.isHold && eventData[booking.eventId] && (
                                            <div className="bg-yellow-100 border border-yellow-300 p-3 rounded-lg flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                <p className="text-sm text-yellow-800">
                                                    Pay at least {eventData[booking.eventId].minimumPaymentPercent}% of the total amount ({formatCurrency(booking.totalAmount * (eventData[booking.eventId].minimumPaymentPercent / 100))}) by {formatDate(booking.holdExpiry || '')} to avoid cancellation.
                                                </p>
                                            </div>
                                        )}
                                        {booking.status === 'cancelled' && booking.bookingCancelReason && (
                                            <div className="bg-red-100 border border-red-300 p-3 rounded-lg flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                                <p className="text-sm text-red-800">
                                                    Booking Cancelled: {booking.bookingCancelReason}
                                                </p>
                                            </div>
                                        )}
                                        <h2 className="text-xl font-bold text-gray-900">{booking.eventName}</h2>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="flex items-start gap-2">
                                                <Building className="h-4 w-4 text-blue-600 mt-0.5" />
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-sm">Booking ID</h3>
                                                    <p className="text-gray-600 text-sm">{booking.bookingId}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-sm">Booked On</h3>
                                                    <p className="text-gray-600 text-sm">{formatDate(booking.createdAt)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-sm">Event</h3>
                                                    <p className="text-gray-600 text-sm">{booking.eventName}</p>
                                                    <Button
                                                        variant="link"
                                                        className="p-0 h-auto text-blue-600 text-xs cursor-pointer hover:text-blue-700"
                                                        onClick={() => navigate(`/events/${booking.eventId}`)}
                                                    >
                                                        View Event Details
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Building className="h-4 w-4 text-blue-600 mt-0.5" />
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-sm">Organization</h3>
                                                    <p className="text-gray-600 text-sm">{booking.businessInfo.name}</p>
                                                    <p className="text-gray-600 text-sm">{booking.businessInfo.email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <h3 className="font-semibold text-gray-900 text-sm mb-2">Payment Details</h3>
                                            <p className="text-gray-600 text-sm">Total Amount: {formatCurrency(booking.totalAmount)}</p>
                                            <p className="text-gray-600 text-sm">Pending Amount: {formatCurrency(booking.pendingAmount)}</p>
                                        </div>
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
                                                            const base = stall.sizeInSqFt * stall.rate;
                                                            const upcharge = parseFloat(((stall.upchargeInPercent / 100) * base).toFixed(2));
                                                            const vat = 0.13 * (base + upcharge);
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
                                                        <tr className="font-semibold text-gray-800 bg-gray-100">
                                                            <td className="p-2" colSpan={7}>Subtotal</td>
                                                            <td className="p-2">
                                                                {formatCurrency(
                                                                    parseFloat(
                                                                        booking.stallInfo.reduce((acc, stall) => {
                                                                            const base = stall.sizeInSqFt * stall.rate;
                                                                            const upcharge = (stall.upchargeInPercent / 100) * base;
                                                                            const vat = 0.13 * (base + upcharge);
                                                                            return acc + base + upcharge + vat;
                                                                        }, 0).toFixed(2)
                                                                    )
                                                                )}
                                                            </td>
                                                        </tr>
                                                        <tr className="font-semibold text-gray-800 bg-gray-100">
                                                            <td className="p-2" colSpan={7}>Discount</td>
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
                                                        <tr className="font-semibold text-gray-800 bg-gray-100">
                                                            <td className="p-2" colSpan={7}>Total</td>
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
                                        {booking.payments.length > 0 && (
                                            <div className="mt-4">
                                                <h3 className="font-semibold text-gray-900 text-sm mb-2">Payment History</h3>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-100">
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Amount</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Payment Date</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Payment Method</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Status</th>
                                                                <th className="text-left p-2 text-sm font-medium text-gray-600">Proof</th>
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
                                                                                <Eye className="h-4 w-4 mr-1" />
                                                                                View
                                                                            </Button>
                                                                        ) : (
                                                                            <span className="text-gray-500">No Proof</span>
                                                                        )}
                                                                    </td>
                                                                    {payment.status === "failed" && payment.failedNote && (
                                                                        <td className="p-2 text-red-600 text-sm">{payment.failedNote}</td>
                                                                    )}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                        {booking.paymentStatus !== 'paid' && (
                                            <Button
                                                variant="outline"
                                                className="flex items-center gap-2 justify-center cursor-pointer text-sm py-1"
                                                onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setIsPaymentDialogOpen(true);
                                                }}
                                            >
                                                {/* <DollarSign className="h-4 w-4" /> */}
                                                Add Payment
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
            <Footer />
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-2xl">
                    <DialogHeader className="pb-6">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                                {/* <DollarSign className="h-5 w-5 text-white" /> */}
                            </div>
                            Add Payment
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePaymentSubmit} className="space-y-5">
                        <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                Payment Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="paidAmount" className="text-sm font-semibold text-gray-700">
                                        Paid Amount *
                                    </Label>
                                    <Input
                                        id="paidAmount"
                                        type="number"
                                        value={paymentForm.paidAmount}
                                        onChange={(e) => {
                                            setPaymentForm({ ...paymentForm, paidAmount: e.target.value });
                                            validateAmount(e.target.value);
                                        }}
                                        placeholder="Enter amount paid"
                                        className="h-12 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 bg-white"
                                        required
                                    />
                                    {amountError && <p className="text-red-500 text-xs">{amountError}</p>}
                                    {selectedBooking && eventData[selectedBooking.eventId]?.minimumPaymentPercent && selectedBooking.isHold && (
                                        <p className="text-yellow-600 text-xs">
                                            Minimum {eventData[selectedBooking.eventId].minimumPaymentPercent}% required ({formatCurrency(selectedBooking.totalAmount * (eventData[selectedBooking.eventId].minimumPaymentPercent / 100))})
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="paymentMethod" className="text-sm font-semibold text-gray-700">
                                        Payment Method *
                                    </Label>
                                    <Select
                                        value={paymentForm.paymentMethod}
                                        onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethod: value })}
                                    >
                                        <SelectTrigger className="h-12 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 bg-white">
                                            <SelectValue placeholder="Select payment method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="eSewa">eSewa</SelectItem>
                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="Credit Card">Credit Card</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-sm font-semibold text-gray-700">
                                        Payment Proof *
                                    </Label>
                                    <div
                                        {...getRootProps()}
                                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300 bg-white'
                                            }`}
                                    >
                                        <input {...getInputProps()} />
                                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        {paymentForm.paymentProof ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <p className="text-sm text-gray-600">{paymentForm.paymentProof.name}</p>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPaymentForm({ ...paymentForm, paymentProof: null });
                                                    }}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-600">
                                                Drag & drop an image or PDF here, or click to select
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsPaymentDialogOpen(false);
                                    setSelectedBooking(null);
                                    setPaymentForm({ paidAmount: '', paymentMethod: '', paymentProof: null });
                                    setAmountError('');
                                }}
                                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold shadow-lg"
                                disabled={!paymentForm.paidAmount || !paymentForm.paymentMethod || !paymentForm.paymentProof || !!amountError}
                            >
                                Submit Payment
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
                <DialogContent className="sm:max-w-2xl bg-white border border-gray-200 shadow-2xl rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900">Payment Proof</DialogTitle>
                    </DialogHeader>
                    {selectedImage && (
                        <div className="flex justify-center">
                            <img src={selectedImage} alt="Payment Proof" className="max-w-full max-h-[60vh] object-contain rounded-lg border border-gray-200 bg-gray-50" />
                        </div>
                    )}
                    <div className="flex justify-end mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsImageDialogOpen(false)}
                            className="h-10 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white rounded-lg"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyBookings;