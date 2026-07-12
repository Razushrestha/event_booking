import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * Props for DashboardHeader component
 * @param adminName - Name of the admin user (optional, defaults to "Admin User")
 * @param adminInitials - Initials for admin avatar (optional, defaults to "AU")
 * @param avatarSrc - Source URL for admin avatar image (optional)
 */
interface DashboardHeaderProps {
    adminName?: string;
    adminInitials?: string;
    avatarSrc?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    adminName = "Admin User",
    adminInitials = "AU",
    avatarSrc = "/placeholder.svg",
}) => {
    return (
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
            <div className="flex items-center">
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Home className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-medium">Admin Dashboard</h2>
            </div>
            <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{adminName}</span>
                <Avatar>
                    <AvatarImage src={avatarSrc} alt="Admin" />
                    <AvatarFallback>{adminInitials}</AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
};