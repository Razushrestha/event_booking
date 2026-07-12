"use client"

import type React from "react"

import { useState } from "react"
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"

interface FloorPlanCarouselProps {
    floorPlans: string[]
    title: string
}

export default function FloorPlanCarousel({ floorPlans, title }: FloorPlanCarouselProps) {
    const imageURL = import.meta.env.VITE_IMAGE_URL || "http://localhost:3000/images/"
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isZoomed, setIsZoomed] = useState(false)
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % floorPlans.length)
    }

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + floorPlans.length) % floorPlans.length)
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
        if (isZoomed) {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * 100
            const y = ((e.clientY - rect.top) / rect.height) * 100
            setZoomPosition({ x, y })
        }
    }

    return (
        <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
            <div className="relative h-full overflow-hidden">
                <img
                    src={imageURL + floorPlans[currentIndex] || "/placeholder.svg"}
                    alt={`${title} Floor Plan ${currentIndex + 1}`}
                    className={`w-full h-full object-contain transition-transform duration-300 cursor-crosshair ${isZoomed ? "scale-150" : "scale-100"
                        }`}
                    style={isZoomed ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` } : {}}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setIsZoomed(true)}
                    onMouseLeave={() => setIsZoomed(false)}
                />
                {!isZoomed && (
                    <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-full flex items-center gap-2 text-sm">
                        <ZoomIn className="h-4 w-4" />
                        Hover to zoom
                    </div>
                )}
            </div>

            {floorPlans.length > 1 && (
                <>
                    <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5 text-gray-700" />
                    </button>
                    <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-colors"
                    >
                        <ChevronRight className="h-5 w-5 text-gray-700" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {floorPlans.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? "bg-blue-600" : "bg-white/70"
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
