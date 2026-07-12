import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, CheckCircle, Download, ArrowLeft } from "lucide-react";
import Navbar from '@/userComponents/navbar';
import { useEffect, useState } from "react";
import { notifyError } from "@/components/toast";
import { getTicketsOfUser } from "@/services/ticketServices";
import { withUploadToken } from "@/lib/uploadUrl";
import Footer from "@/userComponents/footer";

interface TicketFeature {
    name: string;
    status: boolean;
}

interface Ticket {
    _id: string;
    ticketId: string;
    eventId: string;
    eventName: string;
    name: string;
    email: string;
    qr: string;
    status: string;
    submittedAt: string;
    userId: string;
    number: string;
    ticketInfo: {
        tierName: string;
        price: number;
        features: TicketFeature[];
    };
    note?: string;
}

const statusBg = (status: Ticket['status']) => {
    if (status === 'rejected') return 'bg-red-50 border-red-200';
    if (status === 'pending') return 'bg-orange-50 border-orange-200';
    return 'bg-white'; // approved
};

const MyTickets = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [tickets, setTickets] = useState<Ticket[]>([]);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                setLoading(true);
                const ticketData = await getTicketsOfUser();
                setTickets(ticketData);
            } catch (error) {
                console.error("Failed to fetch tickets:", error);
                notifyError("Failed to load ticket details");
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, []);

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) return <div className="text-center py-20 text-gray-600">Loading your tickets...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-16 pb-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-5 z-[-5]"></div>
                <div className="container mx-auto px-4">
                    {/* Back Button */}
                    <div className="mb-4">
                        <Button
                            variant="outline"
                            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                            onClick={() => navigate('/')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Events
                        </Button>
                    </div>

                    <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-6">
                        My Tickets
                    </h1>

                    {tickets.length === 0 ? (
                        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                            <p className="text-gray-600 text-base">No tickets found. Register for an event to see your tickets here!</p>
                            <Button
                                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-base font-medium"
                                onClick={() => navigate('/search')}
                            >
                                Explore Events
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket.ticketId}
                                    className={`relative rounded-xl shadow-md max-w-3xl mx-auto p-4 flex flex-col sm:flex-row gap-4 border-l-2 border-r-2 border-dashed border-gray-300 ${statusBg(ticket.status)}`}
                                    style={{
                                        backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0) 10%, rgba(0,0,0,0) 90%, rgba(0,0,0,0.03) 100%)'
                                    }}
                                >
                                    {/* 3-A: Status Banner (always visible) */}
                                    {/* {ticket.status !== 'approved' && (
                                        <div className={`w-full -mx-4 -mt-4 mb-3 px-4 py-2 rounded-t-xl text-sm font-semibold ${ticket.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {ticket.status.toUpperCase()}
                                            {ticket.status === 'rejected' && ticket.note && (
                                                <span className="block font-normal text-xs mt-1">Reason: {ticket.note}</span>
                                            )}
                                        </div>
                                    )} */}

                                    {/* QR Code Section */}
                                    <div className="w-full sm:w-40 flex-shrink-0">
                                        <div className="bg-gray-50 rounded-lg p-3 relative">
                                            {ticket.status === 'approved' ? (
                                                <img
                                                    src={withUploadToken(ticket.qr)}
                                                    alt={`QR Code for ${ticket.eventName}`}
                                                    className="w-full h-32 object-contain rounded-md"
                                                    onError={(e) => {
                                                        const img = e.target as HTMLImageElement;
                                                        img.style.display = 'none';
                                                        if (img.nextElementSibling) {
                                                            (img.nextElementSibling as HTMLElement).style.display = 'block';
                                                        }
                                                    }}
                                                />
                                            ) : ticket.status === 'pending' ? (
                                                <div className="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs font-medium">
                                                    QR Code Pending
                                                </div>
                                            ) : (
                                                <div className="w-full h-32 bg-red-100 rounded-md flex items-center justify-center text-red-500 text-xs font-medium">
                                                    QR Code Not Available
                                                </div>
                                            )}
                                            <div className="hidden text-center py-8 text-gray-500 text-xs">
                                                QR Code not available
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ticket Details */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                                                {ticket.ticketInfo.tierName} {ticket.ticketInfo.price > 0 ? `(${ticket.ticketInfo.price})` : '(Free)'}
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${ticket.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {ticket.status.toUpperCase()}
                                            </div>
                                        </div>

                                        <h2 className="text-xl font-bold text-gray-900">{ticket.eventName}</h2>

                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <div className="flex items-start gap-2">
                                                <Ticket className="h-4 w-4 text-blue-600 mt-0.5" />
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-sm">Ticket ID</h3>
                                                    <p className="text-gray-600 text-sm">{ticket.ticketId}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-sm">Submitted On</h3>
                                                    <p className="text-gray-600 text-sm">{formatDate(ticket.submittedAt)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-sm">Event</h3>
                                                    <p className="text-gray-600 text-sm">{ticket.eventName}</p>
                                                    <Button
                                                        variant="link"
                                                        className="p-0 h-auto text-blue-600 text-xs cursor-pointer hover:text-blue-700"
                                                        onClick={() => navigate(`/events/${ticket.eventId}`)}
                                                    >
                                                        View Event Details
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2">
                                                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-sm">Attendee</h3>
                                                    <p className="text-gray-600 text-sm">{ticket.name}</p>
                                                    <p className="text-gray-600 text-sm">{ticket.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ticket Features */}
                                        {ticket.ticketInfo.features.length > 1 && (
                                            <div className="mt-3">
                                                <h3 className="font-semibold text-gray-900 text-sm mb-2">Features</h3>
                                                <ul className="space-y-1">
                                                    {ticket.ticketInfo.features.slice(1).map((feature, index) => (
                                                        <li key={index} className="flex items-center gap-2 text-sm">
                                                            <span className={`h-2 w-2 rounded-full ${feature.status ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                            <span className="text-gray-600">
                                                                {feature.name} {feature.status ? '(Redeemed)' : '(Not Redeemed)'}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {ticket.status === 'rejected' && ticket.note && (
                                            <div className="mt-4 bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg">
                                                <h3 className="text-sm font-semibold">Rejection Reason</h3>
                                                <p className="text-sm font-medium">{ticket.note}</p>
                                            </div>
                                        )}

                                        {/* Download QR Button */}
                                        {ticket.status === 'approved' && (
                                            <Button
                                                variant="outline"
                                                className="flex items-center gap-2 justify-center cursor-pointer text-sm py-1"
                                                onClick={async () => {
                                                    try {
                                                        const response = await fetch(withUploadToken(ticket.qr), {
                                                            method: 'GET',
                                                            headers: {
                                                                Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                                                            }
                                                        });

                                                        if (!response.ok) throw new Error("Failed to download image");

                                                        const blob = await response.blob();
                                                        const url = window.URL.createObjectURL(blob);

                                                        const link = document.createElement('a');
                                                        link.href = url;
                                                        link.download = `ticket-${ticket.ticketId}-qr.png`;
                                                        document.body.appendChild(link);
                                                        link.click();

                                                        // Cleanup
                                                        document.body.removeChild(link);
                                                        window.URL.revokeObjectURL(url);
                                                    } catch (err) {
                                                        console.error("Error downloading QR code:", err);
                                                        notifyError("Failed to download QR code.");
                                                    }
                                                }}
                                            >
                                                <Download className="h-4 w-4" />
                                                Download QR Code
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
        </div>
    );
}

export default MyTickets;