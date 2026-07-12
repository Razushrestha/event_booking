import {
    CheckCircle,
    Clock,
    XCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"


const getStatusBadge = (status: string) => {
    switch (status) {
        case "confirmed":
            return (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100" >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Confirmed
                </Badge>
            )
        case "approved":
            return (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved
                </Badge>
            )
        case "rejected":
            return (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                    <XCircle className="h-3 w-3 mr-1" />
                    Rejected
                </Badge>
            )
        case "failed":
            return (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                    <XCircle className="h-3 w-3 mr-1" />
                    Failed
                </Badge>
            )
        case "cancelled":
            return (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100" >
                    <XCircle className="h-3 w-3 mr-1" />
                    Cancelled
                </Badge>
            )
        case "completed":
            return (
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100" >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                </Badge>
            )
        default:
            return (
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100" >
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                </Badge>
            )
    }
}

export default getStatusBadge