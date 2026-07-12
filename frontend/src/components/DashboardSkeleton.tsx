export default function AdminDashboardSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-sm border-r border-gray-200">
                <div className="p-4">
                    <div className="h-8 bg-gray-200 rounded animate-pulse mb-6"></div>
                    <div className="space-y-2">
                        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                    <div className="space-y-6">
                        {/* Navigation Tabs */}
                        <div className="flex space-x-8 border-b border-gray-200">
                            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                        </div>

                        {/* Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                                            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                                        </div>
                                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Upcoming Events */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div className="flex-1">
                                                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                                                <div className="flex space-x-2">
                                                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                                                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Event Ticket Stats */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {[1, 2].map((i) => (
                                        <div key={i} className="p-4 border border-gray-200 rounded-lg">
                                            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-4"></div>
                                            <div className="grid grid-cols-3 gap-4">
                                                {[1, 2, 3].map((j) => (
                                                    <div key={j} className="flex items-center space-x-2">
                                                        <div className="h-3 w-3 bg-gray-200 rounded-full animate-pulse"></div>
                                                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Pending Tickets */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                            <div className="flex items-center space-x-4">
                                                <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse"></div>
                                                <div>
                                                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                                                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div>
                                                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-1"></div>
                                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                                                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Registrations */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {[1, 2, 3, 4].map((i) => (
                                                <th key={i} className="px-6 py-3">
                                                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <tr key={i}>
                                                {[1, 2, 3, 4].map((j) => (
                                                    <td key={j} className="px-6 py-4">
                                                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}