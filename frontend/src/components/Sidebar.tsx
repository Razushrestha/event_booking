import { useLocation, useNavigate } from "react-router-dom"
import { Calendar, LayoutDashboard, Mail, Briefcase, LogOut, Settings, Ticket, Users, QrCode, House } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import useAuthStore from "@/store/authStore"

export function AdminSidebar() {
  const { logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    {
      title: "Home",
      href: "/",
      icon: House,
      match: "/home",
    },
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      match: "/dashboard",
    },
    {
      title: "Events",
      href: "/admin/events",
      icon: Calendar,
      match: "/events",
    },
    {
      title: "Tickets",
      href: "/admin/tickets",
      icon: Ticket,
      match: "/tickets",
    },
    {
      title: "Bookings",
      href: "/admin/bookings",
      icon: Calendar,
      match: "/bookings",
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: Users,
      match: "/users",
    },
    {
      title: "Contact",
      href: "/admin/contact",
      icon: Mail,
      match: "/contact",
    },
    {
      title: "Team",
      href: "/admin/team",
      icon: Users,
      match: "/team",
    },
    {
      title: "Services",
      href: "/admin/services",
      icon: Briefcase,
      match: "/services",
    },
    {
      title: "Payment Methods",
      href: "/admin/payment-methods",
      icon: QrCode,
      match: "/payment-methods",
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: Settings,
      match: "/admin/settings",
    },
  ]

  const isActive = (match: string) => {
    return location.pathname.includes(match)
  }

  const handleNavigation = (href: string) => {
    navigate(href)
  }

  const handleLogout = async () => {
    await logout()
    setTimeout(() => {
      navigate('/login')
    }, 1000)
  }

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen">
      <div className="flex items-center justify-center h-16 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-xl font-bold text-blue-600">Event Admin</h1>
      </div>

      <div className="flex flex-col flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Button
            key={item.title}
            variant={isActive(item.match) ? "secondary" : "ghost"}
            className={cn(
              "justify-start",
              isActive(item.match)
                ? "bg-blue-100 text-blue-700 font-medium hover:bg-blue-200"
                : "hover:bg-gray-200"
            )}
            onClick={() => handleNavigation(item.href)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Button>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <Button
          variant="ghost"
          className="justify-start w-full"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}