// AppRoute.tsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import Register from './Register'
import AdminDashboard from './Dashboard'
// import CreateEventPage from './AddEvent'
import Event from './Event'
import Home from './Home'
import CreateEditEventPage from './EditEvent'
import TicketDetailsPage from './TicketById'
import NotFound from './404'
import ProtectedRoute from '@/components/routing/ProtectedRoute'
import UserRoutes from '@/components/routing/UserRoutes'
import ContactPage from './Contact'
import useAuthStore from '@/store/authStore'
import AdminDashboardNew from './NewDashboard'
import TicketDashboard from './TicketDashboard'
import UsersDashboard from './UserDashboard'
import StallsSetupPage from './StallsSetup'
import BookingsDashboard from './BookingDashboard'
import BookingDetailsPage from './BookingById'
import EventDashboard from './EventDashboard'
import ServicesDashboard from './Services'
import SettingsPage from './Settings'
import EventBookingsPage from './BookingsPerEvent'
import PaymentMethodsDashboard from './PaymentMethods'
import MyTickets from './MyTickets'
import Team from './Team'
import EventSearchPage from './Search'
import { AddProposal } from './EventProposal'
import EventDetails from './EventDetails'
import ContactUs from './ContactUs'
import AboutUs from './AboutUs'
import ServicesClient from './ServicesClient'
import UserSettingsPage from './UserSettings'
import FAQ from './Faqs'
import OrganizationBookings from './OrganizationBookings.tsx'
import ForgetPassword from './ForgetPassword'
import BookStalls from './BookStalls'
import { RegisterOrganization } from './RegisterOrganization.tsx'
import EventTicketsDashboard from './TicketsPerEvent.tsx'
import AdminPrint from './AdminPrint'

const RootRedirect: React.FC = () => {
    const { checkAuth, user } = useAuthStore()
    const isLoggedIn = checkAuth()

    if (!isLoggedIn) return <Navigate to="/login" replace />
    console.log("User:", user)
    const role = user?.role?.toLowerCase()

    // Redirect admins to their dashboard
    if (role === 'admin' && window.location.pathname !== '/admin/dashboard') {
        return <Navigate to="/admin/dashboard" replace />
    }

    // Let non-admins land on the homepage (no redirect)
    return null
}

const AppRoute: React.FC = () => {
    return (
        <Routes>
            {/* Root route - redirects based on auth status */}
            <Route
                path="/"
                element={
                    <>
                        <Home />
                    </>
                }
            />
            <Route
                path="/about-us"
                element={
                    <>
                        <AboutUs />
                    </>
                }
            />

            <Route
                path="/contact-us"
                element={
                    <>
                        <ContactUs />
                    </>
                }
            />
            <Route
                path="/services"
                element={
                    <>
                        <ServicesClient />
                    </>
                }
            />

            <Route
                path="/events/:eventId"
                element={
                    <>
                        <EventDetails />
                    </>
                }
            />
            <Route
                path="/about-us"
                element={
                    <>
                        <AboutUs />
                    </>
                }
            />
            <Route
                path="faqs"
                element={
                    <>
                        <FAQ />
                    </>
                }
            />

            <Route
                path="/search"
                element={
                    <>
                        {/* <RootRedirect /> */}
                        <EventSearchPage />
                    </>
                }
            />

            {/* Public routes - no protection needed */}
            <Route
                path="/login"
                element={
                    <>
                        <RootRedirect />
                        <Login />
                    </>
                }
            />
            <Route
                path="/register-organization"
                element={
                    <>
                        {/* <RootRedirect /> */}
                        <RegisterOrganization />
                    </>
                }
            />
            <Route
                path="/forget-password"
                element={
                    <>
                        <ForgetPassword />
                    </>
                }
            />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />

            <Route path="/my-tickets" element={<MyTickets />} />

            {/* Protected routes - require authentication */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/dashboard"
                element={
                    <ProtectedRoute>
                        <AdminDashboardNew />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/team"
                element={
                    <ProtectedRoute>
                        <Team />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/events/add"
                element={
                    <ProtectedRoute>
                        <CreateEditEventPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/bookings"
                element={
                    <ProtectedRoute>
                        <BookingsDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/events"
                element={
                    <ProtectedRoute>
                        <EventDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/services"
                element={
                    <ProtectedRoute>
                        <ServicesDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/events/:eventId"
                element={
                    <ProtectedRoute>
                        <Event />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/events/edit/:eventId"
                element={
                    <ProtectedRoute>
                        <CreateEditEventPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/bookings/:bookingId"
                element={
                    <ProtectedRoute>
                        <BookingDetailsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/events/:eventId/edit"
                element={
                    <ProtectedRoute>
                        <CreateEditEventPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/events/:id"
                element={
                    <ProtectedRoute>
                        <CreateEditEventPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/events/proposal/:eventId"
                element={
                    <ProtectedRoute>
                        <AddProposal />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/users"
                element={
                    <ProtectedRoute>
                        <UsersDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/stalls-setup/:eventId"
                element={
                    <ProtectedRoute>
                        <StallsSetupPage />
                    </ProtectedRoute>
                }
            />
            {/* <Route
                path="/admin/tickets"
                element={
                    <ProtectedRoute>
                        <RegisterTicketForm />
                    </ProtectedRoute>
                }
            /> */}
            <Route
                path="/admin/tickets/:ticketId"
                element={
                    <ProtectedRoute>
                        <TicketDetailsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/tickets"
                element={
                    <ProtectedRoute>
                        <TicketDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/contact"
                element={
                    <ProtectedRoute>
                        <ContactPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/payment-methods"
                element={
                    <ProtectedRoute>
                        <PaymentMethodsDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/settings"
                element={
                    <ProtectedRoute>
                        <SettingsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/print"
                element={
                    <ProtectedRoute>
                        <AdminPrint />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/bookings/event/:eventId"
                element={
                    <ProtectedRoute>
                        <EventBookingsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/tickets/event/:eventId"
                element={
                    <ProtectedRoute>
                        <EventTicketsDashboard />
                    </ProtectedRoute>
                }
            />

            {/* User Routes */}
            <Route path="/settings"
                element={
                    <UserRoutes>
                        <UserSettingsPage />
                    </UserRoutes>
                }
            />
            <Route path="/book-stalls/:eventId"
                element={
                    // <ProtectedRoute>
                    <BookStalls />
                    // </ProtectedRoute>
                }
            />
            <Route path="/my-bookings"
                element={
                    <UserRoutes>
                        <OrganizationBookings />
                    </UserRoutes>
                }
            />

        </Routes>
    )
}

export default AppRoute