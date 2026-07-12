"use client"

import type { Stall } from "@/interface/Stalls"

interface StallGridProps {
    stalls: Stall[]
    selectedStalls: string[]
    onStallToggle: (stallId: string) => void
}

export default function StallGrid({ stalls, selectedStalls, onStallToggle }: StallGridProps) {
    const getStallStatusColor = (status: string, isSelected: boolean) => {
        if (isSelected) {
            return "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-600 text-white shadow-lg transform scale-105"
        }

        switch (status) {
            case "available":
                return "bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-900 hover:shadow-md"
            case "hold":
                return "bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-500 text-white cursor-not-allowed"
            case "booked":
                return "bg-gradient-to-br from-green-500 to-green-600 border-green-600 text-white cursor-not-allowed"
            default:
                return "bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed"
        }
    }

    const isStallSelected = (stallId: string) => selectedStalls.includes(stallId)
    const isStallClickable = (status: string) => status === "available"

    const handleStallClick = (stall: Stall) => {
        if (isStallClickable(stall.status)) {
            onStallToggle(stall.stallId)
        }
    }

    // Group stalls by type
    const groupedStalls = stalls.reduce(
        (acc, stall) => {
            const type = stall.stallTypeName
            if (!acc[type]) {
                acc[type] = []
            }
            acc[type].push(stall)
            return acc
        },
        {} as Record<string, Stall[]>,
    )

    // Sort stalls within each group
    Object.keys(groupedStalls).forEach((type) => {
        groupedStalls[type].sort((a, b) => a.name.localeCompare(b.name))
    })

    const getTypeColor = (type: string) => {
        if (type.toLowerCase().includes("prime")) return "from-purple-500 to-pink-500"
        if (type.toLowerCase().includes("food")) return "from-orange-500 to-red-500"
        if (type.toLowerCase().includes("bazar")) return "from-green-500 to-teal-500"
        return "from-blue-500 to-indigo-500"
    }

    return (
        <div className="w-full space-y-6">
            {/* Compact Legend */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded"></div>
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded"></div>
                    <span>Hold</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gradient-to-br from-green-500 to-green-600 rounded"></div>
                    <span>Booked</span>
                </div>
            </div>

            {/* Stall Groups */}
            <div className="space-y-6">
                {Object.entries(groupedStalls).map(([stallType, stallsInType]) => (
                    <div key={stallType} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 bg-gradient-to-r ${getTypeColor(stallType)} rounded-full`}></div>
                                <h4 className="font-bold text-gray-900 text-sm">{stallType}</h4>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {stallsInType.length}
                            </span>
                        </div>

                        <div className="grid grid-cols-4 md:grid-cols-4 gap-2">
                            {stallsInType.map((stall) => {
                                const isSelected = isStallSelected(stall.stallId)
                                return (
                                    <button
                                        key={stall.stallId}
                                        onClick={() => handleStallClick(stall)}
                                        disabled={!isStallClickable(stall.status)}
                                        className={`
                      relative aspect-square min-h-[45px] md:min-h-[50px] rounded-lg border-2 font-bold text-xs transition-all duration-300
                      ${getStallStatusColor(stall.status, isSelected)}
                      ${isStallClickable(stall.status) ? "transform hover:scale-110 cursor-pointer" : ""}
                      ${isSelected ? "ring-2 ring-blue-200" : ""}
                    `}
                                        title={`${stall.name} - ${stall.stallTypeName} (${stall.status})`}
                                    >
                                        <div className="flex flex-col items-center justify-center h-full p-1">
                                            <span className="text-xs font-bold leading-tight">{stall.name}</span>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-blue-600 flex items-center justify-center shadow-lg">
                                                <span className="text-blue-600 text-xs font-bold">✓</span>
                                            </div>
                                        )}

                                        {stall.status !== "available" && !isSelected && (
                                            <div className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center">
                                                <span className="text-xs font-bold uppercase tracking-wide opacity-75">{stall.status}</span>
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
