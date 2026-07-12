import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    BookOpen,
    Calendar,
    CalendarDays,
    GalleryHorizontal,
    Heart,
    MapPin,
    Monitor,
    Music,
    PartyPopper,
    Presentation,
    Search,
    ShieldCheck,
    Star,
    Ticket,
    Trophy,
    Users,
} from "lucide-react";
import Navbar from "@/userComponents/navbar";
import Footer from "@/userComponents/footer";
import EventPoster from "@/components/EventPoster";
import { notifyError } from "@/components/toast";
import { getLandingPageData } from "@/services/homeServices";
import { getServiceClientData } from "@/services/serviceClientServices";
import useAuthStore from "@/store/authStore";
import type { ComponentType, KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface FeaturedEvent {
    eventId: string;
    title: string;
    type: string;
    date: string;
    location: string;
    description: string;
    price?: string;
    poster?: string | null;
}

interface UpcomingEvent {
    eventId: string;
    title: string;
    type: string;
    date: string;
    location: string;
    price: string;
    poster?: string | null;
}

interface Category {
    name: string;
    icon: string;
    count: string;
}

interface ServiceItem {
    serviceId: string;
    name: string;
    description?: string;
}

const categoryIconMap: Record<string, ComponentType<{ className?: string }>> = {
    music: Music,
    film: Monitor,
    drama: Presentation,
    trophy: Trophy,
    "book-open": BookOpen,
    monitor: Monitor,
    presentation: Presentation,
    gallery: GalleryHorizontal,
    "party-popper": PartyPopper,
    heart: Heart,
    users: Users,
    calendar: CalendarDays,
};

const Home = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [featuredEvent, setFeaturedEvent] = useState<FeaturedEvent | null>(null);
    const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [landingData, servicesData] = await Promise.all([
                    getLandingPageData(),
                    getServiceClientData().catch(() => []),
                ]);

                setFeaturedEvent(landingData.featuredEvent);
                setUpcomingEvents(landingData.upcomingEvents || []);
                setCategories(landingData.categories || []);
                setServices(servicesData.slice(0, 3));
            } catch (error) {
                console.error("Failed to fetch home page data:", error);
                notifyError("Failed to load home page");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/search?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            navigate(`/search?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const getPrimaryAction = () => {
        if (!user) return { label: "Get Ticket", path: "/login" };
        if (user.role === "organization") {
            return {
                label: "Book Stalls",
                path: `/events/${featuredEvent?.eventId}`,
            };
        }
        if (user.role === "admin") {
            return {
                label: "Manage Event",
                path: `/admin/events/${featuredEvent?.eventId}`,
            };
        }
        return {
            label: "Get Ticket",
            path: `/events/${featuredEvent?.eventId}`,
        };
    };

    const primaryAction = getPrimaryAction();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 pt-28 pb-16">
                    <div className="grid min-h-[28rem] gap-8 lg:grid-cols-2">
                        <div className="flex flex-col justify-center space-y-4 animate-pulse py-4">
                            <div className="h-8 w-40 rounded-full bg-gray-200" />
                            <div className="h-12 w-full rounded-2xl bg-gray-200" />
                            <div className="h-20 w-full rounded-2xl bg-gray-200" />
                            <div className="h-12 w-48 rounded-full bg-gray-200" />
                        </div>
                        <div className="min-h-[28rem] rounded-[2rem] bg-gray-200 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 pt-24 pb-20 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.35),transparent_40%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.25),transparent_35%)]" />
                <div className="container relative mx-auto px-4">
                    <div className="grid min-h-[32rem] items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
                        {/* Left — open content, no box */}
                        <div className="flex flex-col justify-center py-4 lg:py-8">
                            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium">
                                <Star className="h-4 w-4 text-amber-300" />
                                Featured Event
                            </div>

                            <h1 className="mt-6 text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                                {featuredEvent?.title || "Discover Events Across Nepal"}
                            </h1>

                            <div className="mt-5 flex flex-wrap gap-2.5 text-sm text-blue-100">
                                {featuredEvent?.type && (
                                    <span className="rounded-full bg-white/10 px-3 py-1.5">
                                        {featuredEvent.type}
                                    </span>
                                )}
                                {featuredEvent?.date && (
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                                        <Calendar className="h-4 w-4 shrink-0" />
                                        {featuredEvent.date}
                                    </span>
                                )}
                                {featuredEvent?.location && (
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                                        <MapPin className="h-4 w-4 shrink-0" />
                                        {featuredEvent.location}
                                    </span>
                                )}
                            </div>

                            <p className="mt-5 flex-1 text-base leading-relaxed text-blue-100 md:text-lg">
                                {featuredEvent?.description ||
                                    "Browse festivals, conferences, concerts, and exhibitions. Book tickets and stalls in one place."}
                            </p>

                            <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                {featuredEvent?.price && (
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.2em] text-blue-200">
                                            Starting from
                                        </p>
                                        <p className="mt-1 text-3xl font-bold text-white">
                                            {featuredEvent.price}
                                        </p>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        className="rounded-full bg-white px-7 py-5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                                        onClick={() => navigate(primaryAction.path)}
                                    >
                                        {primaryAction.label}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="rounded-full border-white/30 bg-transparent px-7 py-5 text-sm font-semibold text-white hover:bg-white/10"
                                        onClick={() =>
                                            featuredEvent?.eventId &&
                                            navigate(`/events/${featuredEvent.eventId}`)
                                        }
                                    >
                                        View Details
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Right — image panel (mirrors left card) */}
                        <div className="relative min-h-[20rem] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-blue-950/40 lg:min-h-0">
                            <div className="absolute inset-0">
                                <EventPoster
                                    poster={featuredEvent?.poster}
                                    eventType={featuredEvent?.type}
                                    title={featuredEvent?.title || "Featured Event"}
                                    className="h-full w-full"
                                    imageClassName="h-full w-full object-cover"
                                />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                            {featuredEvent?.price && (
                                <div className="absolute right-5 top-5 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold shadow-lg">
                                    {featuredEvent.price}
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-8">
                                <p className="text-sm font-medium uppercase tracking-[0.15em] text-blue-200">
                                    {featuredEvent?.type || "Featured"}
                                </p>
                                <p className="mt-2 line-clamp-2 text-xl font-bold md:text-2xl">
                                    {featuredEvent?.title}
                                </p>
                                {featuredEvent?.location && (
                                    <p className="mt-2 flex items-center gap-2 text-sm text-blue-100">
                                        <MapPin className="h-4 w-4 shrink-0" />
                                        {featuredEvent.location}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-b border-gray-200 bg-white py-8">
                <div className="container mx-auto grid gap-6 px-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                        <p className="text-3xl font-bold text-blue-600">
                            {upcomingEvents.length}+
                        </p>
                        <p className="mt-2 text-sm text-gray-600">Upcoming Events</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                        <p className="text-3xl font-bold text-blue-600">
                            {categories.length}
                        </p>
                        <p className="mt-2 text-sm text-gray-600">Event Categories</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                        <p className="text-3xl font-bold text-blue-600">
                            {services.length > 0 ? services.length : 6}
                        </p>
                        <p className="mt-2 text-sm text-gray-600">Platform Services</p>
                    </div>
                </div>
            </section>

            <section className="bg-white py-14">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-4xl text-center">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Find Events Near You
                        </h2>
                        <p className="mt-3 text-gray-600">
                            Search by event name, location, or category.
                        </p>
                    </div>
                    <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-lg">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search festivals, concerts, conferences..."
                                    aria-label="Search events"
                                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                />
                            </div>
                            <Button
                                className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
                                onClick={handleSearch}
                            >
                                Search Events
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {categories.length > 0 && (
                <section className="bg-gray-50 py-16">
                    <div className="container mx-auto px-4">
                        <div className="mb-10 text-center">
                            <h2 className="text-3xl font-bold text-gray-900">
                                Browse by Category
                            </h2>
                            <p className="mt-3 text-gray-600">
                                Explore events grouped by the experiences you love most.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                            {categories.map((category) => {
                                const Icon =
                                    categoryIconMap[category.icon] || CalendarDays;
                                return (
                                    <button
                                        key={category.name}
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/search?search=${encodeURIComponent(category.name)}`
                                            )
                                        }
                                        className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                            <Icon className="h-7 w-7" />
                                        </div>
                                        <h3 className="font-semibold text-gray-900">
                                            {category.name}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {category.count}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            <section className="bg-white py-16">
                <div className="container mx-auto px-4">
                    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">
                                Upcoming Events
                            </h2>
                            <p className="mt-2 text-gray-600">
                                Tickets, stalls, and registrations are open now.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            className="rounded-full border-blue-600 text-blue-600 hover:bg-blue-50"
                            onClick={() => navigate("/search")}
                        >
                            View All Events
                        </Button>
                    </div>

                    {upcomingEvents.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center text-gray-600">
                            No upcoming events yet. Check back soon.
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {upcomingEvents.map((event) => (
                                <article
                                    key={event.eventId}
                                    className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                                >
                                    <div className="relative h-52 overflow-hidden">
                                        <EventPoster
                                            poster={event.poster}
                                            eventType={event.type}
                                            title={event.title}
                                            className="h-full w-full"
                                            imageClassName="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                        <div className="absolute bottom-4 right-4 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-blue-600 shadow-lg">
                                            {event.price}
                                        </div>
                                    </div>
                                    <div className="space-y-4 p-5">
                                        <div>
                                            <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">
                                                {event.type}
                                            </span>
                                            <h3 className="mt-3 line-clamp-2 text-lg font-bold text-gray-900 group-hover:text-blue-600">
                                                {event.title}
                                            </h3>
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-blue-500" />
                                                <span>{event.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-blue-500" />
                                                <span className="line-clamp-1">
                                                    {event.location}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700"
                                            onClick={() =>
                                                navigate(`/events/${event.eventId}`)
                                            }
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-gray-50 py-16">
                <div className="container mx-auto px-4">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Why EventSolution
                        </h2>
                        <p className="mt-3 text-gray-600">
                            Everything organizers and attendees need in one platform.
                        </p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <Ticket className="mb-4 h-10 w-10 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Smart Ticketing
                            </h3>
                            <p className="mt-2 text-gray-600">
                                Tiered tickets, QR validation, and instant confirmations.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <ShieldCheck className="mb-4 h-10 w-10 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Secure Payments
                            </h3>
                            <p className="mt-2 text-gray-600">
                                Support for eSewa, Khalti, bank transfer, and admin verification.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <Users className="mb-4 h-10 w-10 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Stall Management
                            </h3>
                            <p className="mt-2 text-gray-600">
                                Floor plans, hold periods, exhibitor booking, and payment tracking.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {services.length > 0 && (
                <section className="bg-white py-16">
                    <div className="container mx-auto px-4">
                        <div className="mb-10 flex items-end justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">
                                    Our Services
                                </h2>
                                <p className="mt-2 text-gray-600">
                                    End-to-end support for events of every scale.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="rounded-full"
                                onClick={() => navigate("/services")}
                            >
                                Explore Services
                            </Button>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {services.map((service) => (
                                <div
                                    key={service.serviceId}
                                    className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-blue-50/40 p-6 shadow-sm"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {service.name}
                                    </h3>
                                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                                        {service.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <section className="bg-gradient-to-r from-blue-700 to-indigo-700 py-16 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold">Ready to host your next event?</h2>
                    <p className="mx-auto mt-4 max-w-2xl text-blue-100">
                        Create events, sell tickets, manage stalls, and track registrations from
                        one powerful dashboard.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Button
                            className="rounded-full bg-white px-8 py-6 text-base font-semibold text-blue-700 hover:bg-blue-50"
                            onClick={() => navigate("/register-organization")}
                        >
                            Register as Organizer
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-full border-white/40 px-8 py-6 text-base font-semibold text-white hover:bg-white/10"
                            onClick={() => navigate("/contact-us")}
                        >
                            Contact Our Team
                        </Button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;
