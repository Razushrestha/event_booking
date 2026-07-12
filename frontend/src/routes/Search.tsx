import { useState, useEffect } from "react"
import {
    Search,
    Calendar,
    Clock,
    MapPin,
    User,
    ChevronDown,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import Navbar from "@/userComponents/navbar"
import Footer from "@/userComponents/footer"
import axiosInstance from "@/lib/axios"

// Mock useSearchParams hook for demonstration
const useSearchParams = () => {
    const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search))

    const updateSearchParams = (newParams: URLSearchParams) => {
        const url = new URL(window.location.href)
        url.search = newParams.toString()
        window.history.pushState({}, '', url.toString())
        setSearchParams(new URLSearchParams(newParams))
    }

    return [searchParams, updateSearchParams] as const
}

// Updated search function to use the new endpoint
const searchEvents = async (params: URLSearchParams) => {
    try {
        const response = await axiosInstance.get("/events", { params })
        return response.data
    } catch (error) {
        throw new Error("Failed to fetch search results")
    }
}

interface Event {
    eventId: string
    title: string
    description: string
    location: string
    organizer: string
    startDateTime: string
    endDateTime: string
    eventType: string
    poster: string
    entryType: string
    createdAt: string
}

interface Pagination {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
    nextPage: number | null
    prevPage: number | null
}

export default function EventSearchPage() {
    const [searchParams, setSearchParams] = useSearchParams()

    // Initialize state from URL parameters
    const [query, setQuery] = useState(searchParams.get('search') || "")
    const [events, setEvents] = useState<Event[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [pagination, setPagination] = useState<Pagination | null>(null)
    const [hasSearched, setHasSearched] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Filter states from URL
    const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'upcoming')
    const [selectedType, setSelectedType] = useState(searchParams.get('eventType') || "")
    const [selectedEntry, setSelectedEntry] = useState(searchParams.get('entryType') || "")
    const [selectedSort, setSelectedSort] = useState(searchParams.get('sortBy') || 'closest')
    const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'))
    console.log(currentPage);
    // Available filter options
    const statusOptions = [
        { value: 'upcoming', label: 'Upcoming Events' },
        { value: 'ongoing', label: 'Ongoing Events' },
        { value: 'past', label: 'Past Events' },
        { value: '', label: 'All Events' }
    ]

    const sortOptions = [
        { value: 'closest', label: 'Closest First' },
        { value: 'furthest', label: 'Furthest First' },
        { value: 'newest', label: 'Newest First' },
        { value: 'oldest', label: 'Oldest First' },
        { value: 'alphabetical', label: 'A-Z' }
    ]

    const entryOptions = [
        { value: '', label: 'All Entry Types' },
        { value: 'Free', label: 'Free Events' },
        { value: 'Paid', label: 'Paid Events' }
    ]

    // Perform search when component mounts or URL changes
    useEffect(() => {
        performSearch()
    }, [searchParams])

    // Update URL when filters change
    const updateURL = (updates: Record<string, string | number>) => {
        const newParams = new URLSearchParams(searchParams)

        Object.entries(updates).forEach(([key, value]) => {
            if (value === '' || value === null || value === undefined) {
                newParams.delete(key)
            } else {
                newParams.set(key, value.toString())
            }
        })

        // Reset to page 1 when filters change (except when explicitly setting page)
        if (!('page' in updates)) {
            newParams.delete('page')
            setCurrentPage(1)
        }

        setSearchParams(newParams)
    }

    const performSearch = async () => {
        setIsLoading(true)
        setHasSearched(true)
        setError(null)

        try {
            // Build search params from URL
            const params = new URLSearchParams()

            if (searchParams.get('search')) params.set('search', searchParams.get('search')!)
            if (searchParams.get('status')) params.set('status', searchParams.get('status')!)
            if (searchParams.get('entryType')) params.set('entryType', searchParams.get('entryType')!)
            if (searchParams.get('sortBy')) params.set('sortBy', searchParams.get('sortBy')!)
            if (searchParams.get('page')) params.set('page', searchParams.get('page')!)

            // Set default status to upcoming if no status specified and no search query
            if (!searchParams.get('status') && !searchParams.get('search')) {
                params.set('status', 'upcoming')
            }

            params.set('limit', '12') // Set items per page

            const response = await searchEvents(params)
            setEvents(response.data.events || [])
            setPagination(response.data.pagination)
        } catch (error) {
            console.error("Search failed:", error)
            setError("Failed to search events. Please try again.")
            setEvents([])
            setPagination(null)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        updateURL({ search: query.trim() })
    }

    const handleFilterChange = (filterType: string, value: string) => {
        if (filterType === 'status') setSelectedStatus(value)
        if (filterType === 'entryType') setSelectedEntry(value)
        if (filterType === 'sortBy') setSelectedSort(value)

        updateURL({ [filterType]: value })
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        updateURL({ page })
        // Scroll to top when page changes
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getImageUrl = (posterPath: string | null) => {
        if (!posterPath) return "/api/placeholder/400/300"
        if (posterPath.startsWith('http')) return posterPath
        const imageUrl = import.meta.env.VITE_IMAGE_URL || "http://localhost:5000/images/"
        return `${imageUrl}${posterPath}`
    }

    // Function to highlight search term in text
    const highlightText = (text: string, searchQuery: string) => {
        if (!searchQuery.trim()) return text
        const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`(${escapedQuery})`, 'gi')
        return text.replace(regex, '<span class="bg-yellow-200 px-1 rounded">$1</span>')
    }

    // Get unique event types from current results for filtering
    const eventTypes = [...new Set(events.map(event => event.eventType))].filter(Boolean)

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                {/* Search Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        {searchParams.get('search') ? 'Search Results' : 'Browse Events'}
                    </h1>

                    {/* Search Form */}
                    <form onSubmit={handleSearchSubmit} className="relative max-w-4xl mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search events by title, description, location, organizer..."
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm text-gray-900 placeholder-gray-500"
                                />
                            </div>

                            {/* Search Button */}
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        {/* Status Filter */}
                        <div className="relative min-w-[180px]">
                            <select
                                value={selectedStatus}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {statusOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Entry Type Filter */}
                        <div className="relative min-w-[150px]">
                            <select
                                value={selectedEntry}
                                onChange={(e) => handleFilterChange('entryType', e.target.value)}
                                className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {entryOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Event Type Filter - Dynamic based on results */}
                        {eventTypes.length > 0 && (
                            <div className="relative min-w-[150px]">
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Types</option>
                                    {eventTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        )}

                        {/* Sort Filter */}
                        <div className="relative min-w-[150px]">
                            <select
                                value={selectedSort}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="appearance-none w-full bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Results Summary */}
                    {pagination && (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <p className="text-gray-600">
                                {isLoading ? (
                                    "Loading..."
                                ) : (
                                    <>
                                        Showing <span className="font-semibold">{((pagination.currentPage - 1) * pagination.limit) + 1}</span> to{' '}
                                        <span className="font-semibold">
                                            {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}
                                        </span> of{' '}
                                        <span className="font-semibold">{pagination.totalCount}</span> events
                                        {searchParams.get('search') && (
                                            <> for "<span className="font-semibold">{searchParams.get('search')}</span>"</>
                                        )}
                                    </>
                                )}
                            </p>

                            {/* Active Filters Display */}
                            <div className="flex flex-wrap gap-2">
                                {selectedStatus && (
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${selectedStatus === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                                            selectedStatus === 'ongoing' ? 'bg-green-100 text-green-800' :
                                                selectedStatus === 'past' ? 'bg-gray-100 text-gray-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {statusOptions.find(opt => opt.value === selectedStatus)?.label}
                                    </span>
                                )}
                                {selectedEntry && (
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${selectedEntry === 'Free' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {selectedEntry} Events
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">Loading events...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <div className="text-red-600 font-medium mb-2">Error</div>
                        <p className="text-red-500">{error}</p>
                        <button
                            onClick={performSearch}
                            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* No Results */}
                {hasSearched && !isLoading && !error && events.length === 0 && (
                    <div className="text-center py-12">
                        <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                        <p className="text-gray-500 mb-6">
                            We couldn't find any events matching your criteria. Try adjusting your filters or search terms.
                        </p>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>• Try different search terms</p>
                            <p>• Remove some filters</p>
                            <p>• Check different event statuses</p>
                        </div>
                    </div>
                )}

                {/* Search Results */}
                {events.length > 0 && (
                    <>
                        <div className="space-y-6 mb-8">
                            {events.filter(event => {
                                // Client-side filtering for event types (since backend doesn't filter this)
                                return !selectedType || event.eventType === selectedType
                            }).map((event) => (
                                <div key={event.eventId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
                                    <div className="md:flex">
                                        {/* Event Image */}
                                        <div className="md:w-1/3">
                                            <img
                                                src={getImageUrl(event.poster)}
                                                alt={event.title}
                                                className="w-full h-48 md:h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = "/api/placeholder/400/300"
                                                }}
                                            />
                                        </div>

                                        {/* Event Details */}
                                        <div className="md:w-2/3 p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <h3
                                                        className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors"
                                                        dangerouslySetInnerHTML={{
                                                            __html: highlightText(event.title, searchParams.get('search') || '')
                                                        }}
                                                    />
                                                    <p
                                                        className="text-gray-600 mb-4 line-clamp-2"
                                                        dangerouslySetInnerHTML={{
                                                            __html: highlightText(event.description, searchParams.get('search') || '')
                                                        }}
                                                    />
                                                </div>
                                                <div className="ml-4 flex flex-col items-end space-y-2">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${event.entryType === 'Free'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {event.entryType}
                                                    </span>
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {event.eventType}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Event Meta Information */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                                                    <span>
                                                        {formatDate(event.startDateTime)}
                                                        {event.startDateTime !== event.endDateTime &&
                                                            ` - ${formatDate(event.endDateTime)}`
                                                        }
                                                    </span>
                                                </div>

                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                                                    <span>
                                                        {formatTime(event.startDateTime)} - {formatTime(event.endDateTime)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center text-sm text-gray-600">
                                                    <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                                                    <span
                                                        dangerouslySetInnerHTML={{
                                                            __html: highlightText(event.location, searchParams.get('search') || '')
                                                        }}
                                                    />
                                                </div>

                                                <div className="flex items-center text-sm text-gray-600">
                                                    <User className="h-4 w-4 mr-2 text-blue-500" />
                                                    <span
                                                        dangerouslySetInnerHTML={{
                                                            __html: highlightText(event.organizer, searchParams.get('search') || '')
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                {/* <div className="text-xs text-gray-500">
                                                    Created {formatDate(event.createdAt)}
                                                </div> */}
                                                <a
                                                    href={`/events/${event.eventId}`}
                                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    View Details
                                                    <ExternalLink className="ml-2 h-4 w-4" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
                                <div className="flex flex-1 justify-between sm:hidden">
                                    <button
                                        onClick={() => pagination.hasPrev && handlePageChange(pagination.prevPage!)}
                                        disabled={!pagination.hasPrev}
                                        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => pagination.hasNext && handlePageChange(pagination.nextPage!)}
                                        disabled={!pagination.hasNext}
                                        className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing page <span className="font-medium">{pagination.currentPage}</span> of{' '}
                                            <span className="font-medium">{pagination.totalPages}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                            <button
                                                onClick={() => pagination.hasPrev && handlePageChange(pagination.prevPage!)}
                                                disabled={!pagination.hasPrev}
                                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>

                                            {/* Page Numbers */}
                                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                let pageNum = i + 1

                                                // Adjust page numbers to show current page in center when possible
                                                if (pagination.totalPages > 5) {
                                                    if (pagination.currentPage <= 3) {
                                                        pageNum = i + 1
                                                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                                        pageNum = pagination.totalPages - 4 + i
                                                    } else {
                                                        pageNum = pagination.currentPage - 2 + i
                                                    }
                                                }

                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${pageNum === pagination.currentPage
                                                                ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                )
                                            })}

                                            <button
                                                onClick={() => pagination.hasNext && handlePageChange(pagination.nextPage!)}
                                                disabled={!pagination.hasNext}
                                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    )
}