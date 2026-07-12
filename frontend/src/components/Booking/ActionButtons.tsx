"use client"

import { Clock, CreditCard } from "lucide-react"

interface ActionButtonsProps {
    selectedStalls: string[]
    onBookStalls: () => void
    onStallDetails: () => void
}

export default function ActionButtons({ selectedStalls, onBookStalls, onStallDetails }: ActionButtonsProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-2xl z-30">
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex gap-4">
                    <button
                        onClick={onStallDetails}
                        disabled={selectedStalls.length === 0}
                        className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-4 px-6 rounded-2xl font-bold transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <Clock className="h-5 w-5" />
                            <span>Hold Stalls</span>
                            {selectedStalls.length > 0 && (
                                <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
                                    {selectedStalls.length}
                                </span>
                            )}
                        </div>
                    </button>
                    <button
                        onClick={onBookStalls}
                        disabled={selectedStalls.length === 0}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-400 disabled:cursor-not-allowed text-white py-4 px-6 rounded-2xl font-bold transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <CreditCard className="h-5 w-5" />
                            <span>Book Stalls</span>
                            {selectedStalls.length > 0 && (
                                <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
                                    {selectedStalls.length}
                                </span>
                            )}
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}
