"use client"

import { Store } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface StallData {
    _id: string
    eventId: string
    name: string
    expiryDate: string | null
    status: string
    images: string[]
    stallId: string
    createdAt: string
    updatedAt: string
    stallTypeName: string
    sizeInSqFt: number
    size: string
    rate: number
    location: string
    amenities: string[]
    upchargeInPercent?: number
}

interface StallInvoiceTableProps {
    stallsData: StallData[]
    totalAmount?: number
}

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-NP", {
        style: "currency",
        currency: "NPR",
        minimumFractionDigits: 2,
    }).format(amount)
}

export default function StallInvoiceTable({ stallsData, totalAmount }: StallInvoiceTableProps) {
    if (!stallsData || stallsData.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-sm text-gray-600">No stalls assigned</p>
            </div>
        )
    }

    const calculateSubtotal = () => {
        return stallsData.reduce((acc, stall) => {
            const base = stall.sizeInSqFt * stall.rate
            const upcharge = ((stall.upchargeInPercent || 0) / 100) * base
            const vat = 0.13 * (base + upcharge)
            return acc + base + upcharge + vat
        }, 0)
    }

    const subtotal = calculateSubtotal()
    const discount = totalAmount ? Math.max(0, subtotal - totalAmount) : 0
    const finalTotal = totalAmount || subtotal

    return (
        <div className="w-full">
            {/* Scrollable table container - only horizontal scroll on mobile */}
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse" style={{ minWidth: "800px" }}>
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="text-left p-2 text-sm font-medium text-gray-600 whitespace-nowrap">Stall Name</th>
                            <th className="text-left p-2 text-sm font-medium text-gray-600 whitespace-nowrap">Type</th>
                            <th className="text-left p-2 text-sm font-medium text-gray-600 whitespace-nowrap">Size (sq ft)</th>
                            <th className="text-left p-2 text-sm font-medium text-gray-600 whitespace-nowrap">Rate</th>
                            <th className="text-left p-2 text-sm font-medium text-gray-600 whitespace-nowrap">Sub Total</th>
                            <th className="text-left p-2 text-sm font-medium text-gray-600 whitespace-nowrap">Upcharge</th>
                            <th className="text-left p-2 text-sm font-medium text-gray-600 whitespace-nowrap">VAT(13%)</th>
                            <th className="text-left p-2 text-sm font-medium text-gray-600 whitespace-nowrap">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stallsData.map((stall) => {
                            const base = stall.sizeInSqFt * stall.rate
                            const upcharge = Number.parseFloat((((stall.upchargeInPercent || 0) / 100) * base).toFixed(2))
                            const vat = 0.13 * (base + upcharge)
                            const total = Number.parseFloat((base + upcharge + vat).toFixed(2))

                            return (
                                <tr key={stall._id} className="border-b">
                                    <td className="p-2">
                                        <div className="flex items-center whitespace-nowrap">
                                            <Store className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                            <span>{stall.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-2">
                                        <Badge variant="outline" className="whitespace-nowrap">
                                            {stall.stallTypeName}
                                        </Badge>
                                    </td>
                                    <td className="p-2 whitespace-nowrap">{stall.sizeInSqFt === 1 ? "-" : stall.sizeInSqFt}</td>
                                    <td className="p-2 whitespace-nowrap">{stall.sizeInSqFt === 1 ? "-" : formatCurrency(stall.rate)}</td>
                                    <td className="p-2 whitespace-nowrap">{formatCurrency(base)}</td>
                                    <td className="p-2 whitespace-nowrap">{stall.upchargeInPercent || 0}%</td>
                                    <td className="p-2 whitespace-nowrap">{formatCurrency(vat)}</td>
                                    <td className="p-2 whitespace-nowrap">{formatCurrency(total)}</td>
                                </tr>
                            )
                        })}

                        {/* Subtotal Row */}
                        <tr className="font-semibold text-gray-800 bg-gray-100">
                            <td className="p-2 whitespace-nowrap" colSpan={7}>
                                Subtotal
                            </td>
                            <td className="p-2 whitespace-nowrap">{formatCurrency(subtotal)}</td>
                        </tr>

                        {/* Discount Row */}
                        <tr className="font-semibold text-gray-800 bg-gray-100">
                            <td className="p-2 whitespace-nowrap" colSpan={7}>
                                Discount
                            </td>
                            <td className="p-2 whitespace-nowrap">{formatCurrency(discount)}</td>
                        </tr>

                        {/* Total Row */}
                        <tr className="font-semibold text-gray-800 bg-gray-100">
                            <td className="p-2 whitespace-nowrap" colSpan={7}>
                                Total
                            </td>
                            <td className="p-2 whitespace-nowrap">{formatCurrency(finalTotal)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}
