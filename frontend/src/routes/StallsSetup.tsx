"use client"

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Home, Plus, ArrowLeft, ArrowRight, Building2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AdminSidebar } from "@/components/Sidebar"
import { notifySuccess, notifyError } from "@/components/toast"
import { FloorPlanUpload } from "@/components/StallSetup/FloorPlan"
import { StallsManager } from "@/components/StallSetup/Stalls"
import { StallTypesManager } from "@/components/StallSetup/StallTypes"
import { getEventById } from "@/services/eventServices"
type EventDetails = {
    floorPlans?: string[]
    // Add other properties as needed
}

export default function StallsSetupPage() {
    const [eventDetails, setEventDetails] = useState<EventDetails | null>(null)
    const params = useParams()
    const navigate = useNavigate()
    const eventId = params.eventId as string

    const [currentTab, setCurrentTab] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    // Placeholder usage to avoid "declared but not used" error
    void setIsSubmitting
    useEffect(() => {
        // console.log(eventId)
        // get event details from eventid
        if (!eventId) {
            notifyError("Event ID is missing")
            navigate("/admin/events")
        }
        // You can fetch event details here if needed
        const fetchEventDetails = async () => {
            try {
                const event = await getEventById(eventId);
                // console.log(event)
                if (!event) {
                    notifySuccess("Event not found")
                    navigate("/admin/events")
                }
                setEventDetails(event)
            } catch (error) {
                notifySuccess("Failed to fetch event details")
                navigate("/admin/events")
            }
        }
        fetchEventDetails()
    }, [eventId])

    const tabs = [
        {
            title: "Floor Plan",
            description: "Upload the event floor plan layout",
            icon: MapPin,
        },
        {
            title: "Stall Types",
            description: "Define different types of stalls available",
            icon: Building2,
        },
        {
            title: "Individual Stalls",
            description: "Create specific stalls for each type",
            icon: Plus,
        },
    ]

    const handleNext = () => {
        if (currentTab < tabs.length - 1) {
            setCurrentTab((prev) => prev + 1)
        }
    }

    const handlePrevious = () => {
        if (currentTab > 0) {
            setCurrentTab((prev) => prev - 1)
        }
    }

    const handleFinish = () => {
        notifySuccess("Stalls setup completed successfully")
        navigate(`/events/${eventId}`)
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
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/events/${eventId}`)}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Back to Event
                            </Button>
                            <span className="text-gray-300">|</span>
                            <h2 className="text-lg font-medium">Stalls Setup</h2>
                        </div>
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
                    <Card className="border-none shadow-lg max-w-6xl mx-auto">
                        <CardHeader>
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex space-x-1">
                                    {tabs.map((_, index) => (
                                        <div
                                            key={index}
                                            className={`rounded-full h-2 w-16 ${currentTab >= index ? "bg-blue-600" : "bg-gray-300"
                                                } transition-colors`}
                                        />
                                    ))}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Step {currentTab + 1} of {tabs.length}
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${currentTab >= 0 ? "bg-blue-100" : "bg-gray-100"}`}>
                                    {currentTab === 0 && <MapPin className="h-5 w-5 text-blue-600" />}
                                    {currentTab === 1 && <Building2 className="h-5 w-5 text-blue-600" />}
                                    {currentTab === 2 && <Plus className="h-5 w-5 text-blue-600" />}
                                </div>
                                <div>
                                    <CardTitle>{tabs[currentTab].title}</CardTitle>
                                    <CardDescription>{tabs[currentTab].description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {/* Tab Content */}
                            {currentTab === 0 && eventDetails && (
                                <FloorPlanUpload eventId={eventId} floorPlan={eventDetails.floorPlans} />
                            )}
                            {currentTab === 1 && <StallTypesManager eventId={eventId} />}
                            {currentTab === 2 && <StallsManager eventId={eventId} />}
                        </CardContent>

                        {/* Navigation Footer */}
                        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
                            <div>
                                {currentTab > 0 && (
                                    <Button type="button" variant="outline" onClick={handlePrevious} disabled={isSubmitting}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Previous
                                    </Button>
                                )}
                            </div>
                            <div>
                                {currentTab < tabs.length - 1 ? (
                                    <Button type="button" onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                                        Next
                                        <ArrowRight className="h-4 w-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleFinish}
                                        disabled={isSubmitting}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        Complete Setup
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                </main>
            </div>
        </div>
    )
}
