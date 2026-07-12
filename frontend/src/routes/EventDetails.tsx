import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Tag, ExternalLink, Download, Share2, Heart, ArrowLeft, CheckCircle, Users } from "lucide-react";
import Navbar from '@/userComponents/navbar';
import { useEffect, useState } from "react";
import { notifyError } from "@/components/toast";
import { getEventById } from "@/services/eventServices";
import Footer from "@/userComponents/footer";
import type { EventDataI } from "@/interface/Event";
import useAuthStore from "@/store/authStore";
import EventNotFound from "./EventNotFound";
import RegistrationModal from "@/components/TicketRegistrationModal";

const EventDetails = () => {
  const { user } = useAuthStore();
  const params = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventDataI | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        // console.log("Fetching event with ID:", params.eventId);
        setLoading(true);
        if (typeof params.eventId === "string") {
          const eventData = await getEventById(params.eventId);
          // console.log("Fetched event data:", eventData);
          setEventData(eventData);
        } else {
          throw new Error("Event ID is missing");
        }
      } catch (error) {
        console.error("Failed to fetch event:", error);
        notifyError("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [params.eventId]);

  // Determine entry type based on ticket tier prices
  const getEntryTypeInfo = (ticketTiers: any[]) => {
    if (eventData?.entryType === "paid") {
      return { type: 'paid', display: 'Paid Entry', color: 'blue' };
    }
    if (!ticketTiers || ticketTiers.length === 0) {
      return { type: 'free', display: 'Free Entry', color: 'green' };
    }

    const prices = ticketTiers.map(tier => tier.price);
    const hasFree = prices.some(price => price === 0);
    const hasPaid = prices.some(price => price > 0);

    if (hasFree && hasPaid) {
      return { type: 'mixed', display: 'Free & Paid Entries', color: 'blue' };
    } else if (hasPaid && !hasFree) {
      return { type: 'paid', display: 'Paid Entry', color: 'blue' };
    } else {
      return { type: 'free', display: 'Free Entry', color: 'green' };
    }
  };

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Check if current date is before or between event start and end dates
  const isEventActive = () => {
    if (!eventData) return false;
    const now = new Date();
    // const start = new Date(eventData.startDateTime);
    const end = new Date(eventData.endDateTime);
    // console.log("This event is active:", now <= end, "Current time:", now, "Start time:", start, "End time:", end);
    return now <= end;
  };

  if (loading) return <div className="text-center py-20 text-gray-600">Loading event details...</div>;
  if (!eventData) return <EventNotFound />;

  const entryInfo = getEntryTypeInfo(eventData.ticketTiers);
  const eventActive = isEventActive();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        eventData={eventData}
      />

      {/* Hero Section */}
      <section className="relative pt-20 pb-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 z-[-5]"></div>
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="outline" className="flex items-center gap-2 cursor-pointer hover:bg-gray-50" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left Content - Event Image */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="relative">
                    {eventData.poster && (
                      <div className="flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                        <img
                          src={`${import.meta.env.VITE_IMAGE_URL || ''}${eventData.poster}`}
                          alt={eventData.title}
                          className="w-full h-auto object-contain max-h-[32rem] transition-all duration-300"
                          style={{ maxHeight: "32rem" }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/400x300?text=Event+Poster';
                          }}
                        />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/90 hover:bg-white"
                        onClick={() => setIsFavorited(!isFavorited)}
                      >
                        <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                      <Button size="sm" variant="outline" className="bg-white/90 hover:bg-white">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <div className={`bg-${entryInfo.color}-500 text-white px-3 py-1 rounded-full text-sm font-medium`}>
                        {entryInfo.display.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="p-6 space-y-4">
                    {user?.role?.toLowerCase() === "admin" ? (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        onClick={() => navigate(`/admin/events/edit/${eventData.eventId}`)}
                      >
                        Edit Event
                      </Button>
                    ) : user?.role?.toLowerCase() === "organization" && eventActive ? (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        onClick={() => {
                          // const bookSection = document.getElementById('book');
                          // if (bookSection) {
                          //   bookSection.scrollIntoView({ behavior: 'smooth' });
                          // }
                          navigate(`/book-stalls/${eventData.eventId}`);
                        }}
                      >
                        Book Stall
                      </Button>
                    ) : eventActive ? (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        onClick={() => {
                          if (user) {
                            setIsRegistrationModalOpen(true);
                          } else {
                            navigate('/login');
                          }
                        }}
                      >
                        Register {entryInfo.type === "free" ? "Free" : "Now"}
                      </Button>
                    ) : (
                      // <p className="text-gray-600 text-center">Event registration is closed</p>
                      <>
                      </>
                    )}
                    <div className="space-y-3">
                      {eventData.googleMapUrl && (
                        <Button
                          variant="outline"
                          className="w-full flex items-center gap-2 justify-center cursor-pointer"
                          onClick={() => window.open(eventData.googleMapUrl, '_blank')}
                        >
                          <MapPin className="h-4 w-4" />
                          View Map
                        </Button>
                      )}
                      {eventData.proposal && (
                        <Button
                          variant="outline"
                          className="w-full flex items-center gap-2 justify-center cursor-pointer"
                          onClick={() => window.open(`${import.meta.env.VITE_IMAGE_URL || ''}${eventData.proposal}`, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                          Proposal
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Event Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title and Basic Info */}
              <div>
                {eventData.eventType && (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                      {eventData.eventType}
                    </div>
                  </div>
                )}
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-4">
                  {eventData.title}
                </h1>

                {/* Key Details Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {eventData.startDateTime && eventData.endDateTime && (
                    <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                      <Calendar className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        {eventData.startDateTime !== eventData.endDateTime ? (
                          <>
                            <h3 className="font-semibold text-gray-900">Event Dates</h3>
                            <p className="text-gray-600">{formatDate(eventData.startDateTime)}</p>
                            <p className="text-gray-600">to {formatDate(eventData.endDateTime)}</p>
                          </>
                        ) : (
                          <>
                            <h3 className="font-semibold text-gray-900">Event Date</h3>
                            <p className="text-gray-600">{formatDate(eventData.startDateTime)}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {eventData.scheduleStart && eventData.scheduleEnd && (
                    <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                      <Clock className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Daily Hours</h3>
                        <p className="text-gray-600">
                          {formatTime(eventData.scheduleStart)} - {formatTime(eventData.scheduleEnd)}
                        </p>
                        <p className="text-sm text-gray-500">5 Days Event</p>
                      </div>
                    </div>
                  )}
                  {eventData.location && (
                    <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                      <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Location</h3>
                        <p className="text-gray-600">{eventData.location}</p>
                        {eventData.googleMapUrl && (
                          <Button
                            variant="link"
                            className="p-0 h-auto text-blue-600 cursor-pointer hover:text-blue-700"
                            onClick={() => window.open(eventData.googleMapUrl, '_blank')}
                          >
                            View on Google Maps <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                    <Tag className="h-5 w-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Entry</h3>
                      <p className={`text-${entryInfo.color}-600 font-semibold`}>
                        {entryInfo.display}
                      </p>
                      {entryInfo.type === 'mixed' && eventData.ticketTiers && (
                        <div className="text-sm text-gray-500 mt-1">
                          {/* {eventData.ticketTiers.map((tier, index) => (
                            <span key={tier.name}>
                              {tier.name}: {tier.price === 0 ? 'Free' : `₹${tier.price}`}
                              {index < eventData.ticketTiers.length - 1 && ', '}
                            </span>
                          ))} */}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {eventData.hasStalls && eventData.registrationOpen && eventData.registrationClose && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Information</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Registration Opens</p>
                        <p className="text-gray-600">{formatDate(eventData.registrationOpen)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Registration Closes</p>
                        <p className="text-gray-600">{formatDate(eventData.registrationClose)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {eventData.description && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {eventData.description}
                  </p>
                </div>
              )}

              {(eventData.organizer || eventData.managedBy) && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Organizer</h2>
                  <div className="flex items-start gap-4">
                    {eventData.organizerLogo ? (
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <img
                          src={`${import.meta.env.VITE_IMAGE_URL || ''}${eventData.organizerLogo}`}
                          alt={eventData.organizer || 'Organizer'}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement as HTMLElement;
                            parent.innerHTML = '<Users className="h-8 w-8 text-blue-600" />';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      {eventData.organizer && (
                        <h3 className="font-bold text-gray-900 text-lg">{eventData.organizer}</h3>
                      )}
                      {eventData.managedBy && (
                        <p className="text-gray-600 mb-2">Managed by: {eventData.managedBy}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {eventData.floorPlans && eventData.floorPlans.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Floor Plan</h2>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <img
                      src={`${import.meta.env.VITE_IMAGE_URL || ''}${eventData.floorPlans[0]}`}
                      alt="Floor Plan"
                      className="w-full h-auto rounded-lg"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        const sibling = img.nextElementSibling as HTMLElement | null;
                        if (sibling) {
                          sibling.style.display = 'block';
                        }
                      }}
                    />
                    <div className="hidden text-center py-8 text-gray-500">
                      Floor plan will be available soon
                    </div>
                  </div>
                </div>
              )}

              {eventData.location && (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Location & Contact</h2>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">{eventData.location}</p>
                        <p className="text-gray-600">Exhibition Hall, Kathmandu, Nepal</p>
                      </div>
                      {eventData.googleMapUrl && (
                        <>
                          <br />
                          <Button
                            variant="link"
                            className="p-0 h-auto text-blue-600 cursor-pointer hover:text-blue-700"
                            onClick={() => window.open(eventData.googleMapUrl, '_blank')}
                          >
                            View on Google Maps <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {user?.role?.toLowerCase() === "user" && eventActive && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Ready to Join {eventData.title}?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Register now for {entryInfo.type === 'free' ? 'free' : entryInfo.type === 'mixed' ? 'your preferred ticket' : 'your ticket'} and
              be part of this incredible event.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => setIsRegistrationModalOpen(true)}
              >
                Register {entryInfo.type === 'free' ? 'Free' : 'Now'}
              </Button>
              {eventData.proposal && (
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-full text-lg font-medium"
                  onClick={() => window.open(`${import.meta.env.VITE_IMAGE_URL || ''}${eventData.proposal}`, '_blank')}
                >
                  Download Proposal
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {eventData.hasStalls && eventActive && (
        <section id="book" className="py-12 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Book or Hold Your Stall</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
              Want to book or hold a stall at this event? Use our mobile app for the best experience and instant booking!
            </p>
            <div className="flex flex-col items-center gap-4">
              <a
                href="https://play.google.com/store/apps/details?id=com.nepatronix.eventsolutions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Get it on Google Play"
                  className="h-14"
                />
              </a>
              <span className="text-gray-500 text-sm">Download our app to book your stall now!</span>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default EventDetails;