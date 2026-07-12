import { Button } from "@/components/ui/button";
import { X, Upload } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { notifyError, notifySuccess } from "@/components/toast";
import type { EventDataI } from "@/interface/Event";
import { registerTicketByUser } from "@/services/ticketServices";
// import { getUserDetailByUser } from "@/services/userServices";
import useAuthStore from "@/store/authStore";

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventData: EventDataI | null;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose, eventData }) => {
    const { user } = useAuthStore();
    const [formData, setFormData] = useState({
        eventId: '',
        name: user?.name || '',
        email: user?.email || '',
        number: user?.phone || '',
        tierName: '',
        paymentScreenshot: null as File | null,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);


    useEffect(() => {
        if (eventData && isOpen && eventData.ticketTiers?.length > 0) {
            const defaultTier = eventData.ticketTiers[0].name.toLowerCase();
            setFormData(prev => ({
                ...prev,
                eventId: eventData.eventId || '',
                tierName: defaultTier,
                paymentScreenshot: null // Reset payment screenshot on open
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                eventId: '',
                tierName: '',
                paymentScreenshot: null
            }));
        }
    }, [eventData, isOpen]);

    // Find the selected tier
    const selectedTier = eventData?.ticketTiers?.find(tier => tier.name.toLowerCase() === formData.tierName);
    const requiresPayment = selectedTier ? selectedTier.price !== 0 : false;

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        console.log(selectedTier)
        if (name === 'tierName') {
            // When tier changes, check if new tier requires payment
            const newTier = eventData?.ticketTiers?.find(tier => tier.name.toLowerCase() === value);
            const newTierRequiresPayment = newTier ? newTier.price > 0 : false;

            setFormData(prev => ({
                ...prev,
                [name]: value,
                // Reset payment screenshot if switching to a free tier
                paymentScreenshot: newTierRequiresPayment ? prev.paymentScreenshot : null
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData(prev => ({
            ...prev,
            paymentScreenshot: file
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate payment screenshot for paid tiers
        if (requiresPayment && !formData.paymentScreenshot) {
            notifyError('Payment screenshot is required for paid tiers.');
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData = new FormData();
            submitData.append('eventId', formData.eventId);
            submitData.append('name', formData.name);
            submitData.append('email', formData.email);
            submitData.append('number', formData.number);
            submitData.append('tierName', formData.tierName);

            // Only append payment screenshot for paid tiers
            if (requiresPayment && formData.paymentScreenshot) {
                submitData.append('paymentScreenshot', formData.paymentScreenshot);
            }

            console.log('Registration data:', Object.fromEntries(submitData));
            await registerTicketByUser(submitData);

            notifySuccess('Registration successful!');
            onClose();

            setFormData({
                eventId: eventData?.eventId || '',
                name: '',
                email: '',
                number: '',
                tierName: eventData?.ticketTiers?.length && eventData.ticketTiers.length > 0 ? eventData.ticketTiers[0].name.toLowerCase() : '',
                paymentScreenshot: null
            });
        } catch (error) {
            console.error('Registration failed');
            console.error(error);
            notifyError('Registration failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Handle case where eventData or ticketTiers is missing
    if (!eventData || !eventData.ticketTiers || eventData.ticketTiers.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/10 backdrop-blur-[3px] bg-opacity-20 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h2 className="text-2xl font-bold text-[#e92429]">Event Registration</h2>
                        <Button
                            variant="outline"
                            size="sm"
                            className="p-2"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="text-center py-6 text-gray-600">
                        No ticket tiers available for this event.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-[3px] bg-opacity-20 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-[#e92429]">Event Registration</h2>
                        <p className="text-gray-600 text-sm mt-1">Register for {eventData.title}</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="p-2"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            placeholder="Enter your full name"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            placeholder="Enter your email address"
                        />
                    </div>

                    {/* Mobile Number */}
                    <div>
                        <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">
                            Mobile Number *
                        </label>
                        <input
                            type="tel"
                            id="number"
                            name="number"
                            value={formData.number}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            placeholder="Enter your mobile number"
                        />
                    </div>

                    {/* Tier Selection */}
                    <div>
                        <label htmlFor="tierName" className="block text-sm font-medium text-gray-700 mb-2">
                            Ticket Category *
                        </label>
                        {eventData.ticketTiers.length === 1 ? (
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-900">
                                {eventData.ticketTiers[0].name} {eventData.ticketTiers[0].price > 0 ? `(₹${eventData.ticketTiers[0].price})` : '(Free)'}
                            </div>
                        ) : (
                            <select
                                id="tierName"
                                name="tierName"
                                value={formData.tierName}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            >
                                {eventData.ticketTiers.map(tier => (
                                    <option key={tier.name} value={tier.name.toLowerCase()}>
                                        {tier.name} {tier.price > 0 ? `(Rs. ${tier.price})` : '(Free)'}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Payment Screenshot - Only shown for paid tiers (price > 0) */}
                    {requiresPayment && (
                        <div>
                            <label htmlFor="paymentScreenshot" className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Screenshot *
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="paymentScreenshot"
                                    name="paymentScreenshot"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors file:mr-3 file:py-1 file:px-3 file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                                    <Upload className="h-4 w-4" />
                                    <span>Upload payment confirmation screenshot</span>
                                </div>
                            </div>
                            {formData.paymentScreenshot && (
                                <p className="text-sm text-green-600 mt-2">
                                    File selected: {formData.paymentScreenshot.name}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Event Info Display */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Event:</span>
                            <span className="font-medium text-gray-900">{eventData.title}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Ticket Category:</span>
                            <span className="font-medium text-gray-900">
                                {selectedTier ? selectedTier.name : 'Not selected'}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Entry Type:</span>
                            <span className={`font-medium ${!requiresPayment ? 'text-green-600' : 'text-blue-600'}`}>
                                {!requiresPayment ? 'Free Entry' : `Paid Entry (₹${selectedTier?.price})`}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Location:</span>
                            <span className="font-medium text-gray-900">{eventData.location}</span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-[#0a519d] hover:cursor-pointer text-white"
                            disabled={isSubmitting || !formData.tierName}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Registering...
                                </span>
                            ) : (
                                'Register Now'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegistrationModal;