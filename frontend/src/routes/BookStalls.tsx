"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Search, Filter } from "lucide-react"
import FloorPlanCarousel from "@/components/Booking/FloorPlanCarousel"
import StallGrid from "@/components/Booking/StallGrid"
import HoldStallDialog from "@/components/Booking/HoldStallDialog"
import BookStallDialog from "@/components/Booking/BookStallDialog"
import { getAllStallsByEventId } from "@/services/stallBookingServices"
import { useParams, useNavigate } from "react-router-dom"
import { notifySuccess } from "@/components/toast"

interface Stall {
    stallId: string
    name: string
    status: string
    stallTypeName: string
}

interface EventData {
    eventId: string
    title: string
    floorPlan: string | null
    floorPlans: string[]
    stalls: Stall[]
}

export default function StallBookingSystem() {
    const params = useParams()
    const navigate = useNavigate()
    const [selectedStalls, setSelectedStalls] = useState<string[]>([])
    const [eventData, setEventData] = useState<EventData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [isHoldDialogOpen, setIsHoldDialogOpen] = useState(false)
    const [isBookDialogOpen, setIsBookDialogOpen] = useState(false)
    const [selectedFilter, setSelectedFilter] = useState<string>("all")

    const fetchEventData = async () => {
        setIsLoading(true)
        try {
            if (!params.eventId) {
                setError("No event ID provided.")
                setIsLoading(false)
                return
            }
            const data = await getAllStallsByEventId(params.eventId as string)
            console.log(data)
            setEventData(data)
            setError(null)
        } catch (err) {
            setError("Failed to load event data. Please try again later.")
        } finally {
            setIsLoading(false)
        }
    }
    useEffect(() => {
        fetchEventData()
    }, [])

    const handleStallToggle = (stallId: string) => {
        setSelectedStalls((prev) => (prev.includes(stallId) ? prev.filter((id) => id !== stallId) : [...prev, stallId]))
    }

    const handleBookStalls = () => {
        setIsBookDialogOpen(true)
    }

    const handleStallDetails = () => {
        setIsHoldDialogOpen(true)
    }

    const handleHoldSuccess = () => {
        setIsHoldDialogOpen(false)
        setSelectedStalls([])
        fetchEventData() // Refresh event data to reflect held stalls
        notifySuccess("Stalls held successfully!")
    }

    const handleBookSuccess = () => {
        setIsBookDialogOpen(false)
        setSelectedStalls([])
        fetchEventData() // Refresh event data to reflect booked stalls
        notifySuccess("Stalls booked successfully!")
    }

    const handleGoBack = () => {
        navigate(-1)
    }

    // Filter stalls based on search query and filter
    const filteredStalls =
        eventData?.stalls.filter((stall) => {
            const matchesSearch = stall.name.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesFilter =
                selectedFilter === "all" ||
                (selectedFilter === "available" && stall.status === "available") ||
                (selectedFilter === "prime" && stall.stallTypeName.toLowerCase().includes("prime")) ||
                (selectedFilter === "normal" && stall.stallTypeName.toLowerCase().includes("normal")) ||
                (selectedFilter === "food" && stall.stallTypeName.toLowerCase().includes("food"))
            return matchesSearch && matchesFilter
        }) || []

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading event data...</p>
                </div>
            </div>
        )
    }

    if (error || !eventData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-xl shadow-lg">
                    <p className="text-red-600 text-lg font-medium">{error || "No event data available."}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="p-3 md:p-6">
                {/* Go Back Button */}
                <div className="mb-4 md:mb-6">
                    <button
                        onClick={handleGoBack}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="font-medium">Go Back</span>
                    </button>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:flex gap-6 h-[calc(100vh-140px)]">
                    {/* Floor Plan Section */}
                    <div className="flex-1">
                        <div className="bg-white rounded-2xl shadow-sm h-full p-6">
                            <div className="mb-4">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Floor Plan</h2>
                                <p className="text-sm text-gray-600">Hover to zoom and see details</p>
                            </div>
                            <div className="h-[calc(100%-80px)]">
                                <FloorPlanCarousel floorPlans={eventData.floorPlans} title={eventData.title} />
                            </div>
                        </div>
                    </div>

                    {/* Select Stalls Section */}
                    <div className="w-96">
                        <div className="bg-white rounded-2xl shadow-sm h-full p-6 flex flex-col">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Stalls</h2>

                                {/* Search and Filter */}
                                <div className="space-y-3 mb-6">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search stalls..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 text-gray-500" />
                                        <select
                                            value={selectedFilter}
                                            onChange={(e) => setSelectedFilter(e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        >
                                            <option value="all">All Stalls</option>
                                            <option value="available">Available Only</option>
                                            <option value="prime">Prime Stalls</option>
                                            <option value="normal">Normal Stalls</option>
                                            <option value="food">Food Court</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Stall Grid */}
                            <div className="flex-1 overflow-y-auto mb-6">
                                <StallGrid stalls={filteredStalls} selectedStalls={selectedStalls} onStallToggle={handleStallToggle} />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handleStallDetails}
                                    disabled={selectedStalls.length === 0}
                                    className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-bold transition-all duration-300"
                                >
                                    Hold
                                    {selectedStalls.length > 0 && (
                                        <span className="ml-2 bg-white/20 text-white text-sm font-bold px-2 py-1 rounded-full">
                                            {selectedStalls.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={handleBookStalls}
                                    disabled={selectedStalls.length === 0}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-bold transition-all duration-300"
                                >
                                    Book
                                    {selectedStalls.length > 0 && (
                                        <span className="ml-2 bg-white/20 text-white text-sm font-bold px-2 py-1 rounded-full">
                                            {selectedStalls.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden">
                    {/* Floor Plan Section */}
                    <div className="mb-6">
                        <div className="bg-white rounded-2xl shadow-sm p-4">
                            <div className="mb-4">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Floor Plan</h2>
                                <p className="text-sm text-gray-600">Hover to zoom and see details</p>
                            </div>
                            <div className="h-[40vh]">
                                <FloorPlanCarousel floorPlans={eventData.floorPlans} title={eventData.title} />
                            </div>
                        </div>
                    </div>

                    {/* Select Stalls Section */}
                    <div className="bg-white rounded-2xl shadow-sm p-4 pb-24">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Stalls</h2>

                            {/* Search and Filter */}
                            <div className="space-y-3 mb-6">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search stalls..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                </div>

                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-gray-500" />
                                    <select
                                        value={selectedFilter}
                                        onChange={(e) => setSelectedFilter(e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="all">All Stalls</option>
                                        <option value="available">Available Only</option>
                                        <option value="prime">Prime Stalls</option>
                                        <option value="normal">Normal Stalls</option>
                                        <option value="food">Food Court</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Stall Grid - Full Length */}
                        <div>
                            <StallGrid stalls={filteredStalls} selectedStalls={selectedStalls} onStallToggle={handleStallToggle} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Fixed Action Buttons for Mobile */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-2xl z-50">
                <div className="p-4">
                    <div className="flex gap-3">
                        <button
                            onClick={handleStallDetails}
                            disabled={selectedStalls.length === 0}
                            className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-bold transition-all duration-300"
                        >
                            Hold
                            {selectedStalls.length > 0 && (
                                <span className="ml-2 bg-white/20 text-white text-sm font-bold px-2 py-1 rounded-full">
                                    {selectedStalls.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={handleBookStalls}
                            disabled={selectedStalls.length === 0}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-bold transition-all duration-300"
                        >
                            Book
                            {selectedStalls.length > 0 && (
                                <span className="ml-2 bg-white/20 text-white text-sm font-bold px-2 py-1 rounded-full">
                                    {selectedStalls.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <HoldStallDialog
                isOpen={isHoldDialogOpen}
                onClose={() => setIsHoldDialogOpen(false)}
                selectedStalls={selectedStalls}
                stallsData={eventData?.stalls || []}
                onSuccess={handleHoldSuccess}
                onStallToggle={handleStallToggle}
            />

            <BookStallDialog
                isOpen={isBookDialogOpen}
                onClose={() => setIsBookDialogOpen(false)}
                selectedStalls={selectedStalls}
                stallsData={eventData?.stalls || []}
                onSuccess={handleBookSuccess}
                onStallToggle={handleStallToggle}
            />
        </div>
    )
}
