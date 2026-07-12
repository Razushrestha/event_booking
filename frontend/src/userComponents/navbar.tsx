import { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ChevronDown } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAuthStore from '@/store/authStore';

function Navbar() {
    const { checkAuth, user, logout } = useAuthStore();
    const isAuth = checkAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200'
            : 'bg-transparent'
            }`}>
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="text-2xl font-bold text-blue-600 tracking-tight flex items-center h-10">
                    <div className="flex items-center gap-2">
                        <img
                            src="/eventsolution.png"
                            alt="EventSolution Logo"
                            className="h-8 w-auto max-h-10"
                            style={{ maxWidth: '120px' }}
                        />
                    </div>
                </Link>

                {/* Desktop nav */}
                {/* <nav className="hidden md:flex items-center gap-6">
                    <Link to="/concerts" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                        Concerts
                    </Link>
                    <Link to="/movies" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                        Movies
                    </Link>
                    <Link to="/events" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
                        Online Events
                    </Link>
                </nav> */}

                {/* Auth buttons */}
                <div className="hidden md:flex items-center gap-4">
                    {isAuth ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 rounded-full px-4 py-2 text-sm font-medium"
                                >
                                    {user?.name || 'User'}
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                                {user?.role === 'admin' && (
                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/admin/dashboard"
                                            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                        >
                                            Admin Dashboard
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                {user?.role === 'user' && (
                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/my-tickets"
                                            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                        >
                                            My Tickets
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                {user?.role === 'organization' && (
                                    <DropdownMenuItem asChild>
                                        <Link
                                            to="/my-bookings"
                                            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                        >
                                            My Bookings
                                        </Link>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem asChild>
                                    <Link
                                        to={user?.role === 'admin' ? "/admin/settings" : "/settings"}
                                        className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                    >
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                                >
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <>
                            <Link to="/login">
                                <Button
                                    variant="ghost"
                                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200 rounded-full px-6 py-2 text-sm font-medium"
                                >
                                    Login
                                </Button>
                            </Link>
                            <Link to="/register">
                                <Button
                                    className="bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 rounded-full px-6 py-2 text-sm font-medium shadow-md"
                                >
                                    Register
                                </Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile nav toggle */}
                <div className="md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-700 hover:bg-gray-100">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="w-64 p-6 bg-white border-l border-gray-200"
                        >
                            <div className="flex flex-col gap-4 mt-6">
                                {/* <Link to="/concerts" className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2">
                                    Concerts
                                </Link>
                                <Link to="/movies" className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2">
                                    Movies
                                </Link>
                                <Link to="/events" className="text-gray-700 hover:text-blue-600 transition-colors font-medium py-2">
                                    Online Events
                                </Link> */}
                                <hr className="my-2" />
                                {isAuth ? (
                                    <>
                                        <div className="text-blue-600 text-sm font-medium">
                                            {user?.name || 'User'}
                                        </div>
                                        <Link to="/settings">
                                            <Button
                                                variant="outline"
                                                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 rounded-full py-2 text-sm font-medium"
                                            >
                                                Settings
                                            </Button>
                                        </Link>
                                        <Button
                                            onClick={handleLogout}
                                            className="w-full bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 rounded-full py-2 text-sm font-medium"
                                        >
                                            Logout
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login">
                                            <Button
                                                variant="outline"
                                                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 rounded-full py-2 text-sm font-medium"
                                            >
                                                Login
                                            </Button>
                                        </Link>
                                        <Link to="/register">
                                            <Button
                                                className="w-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 rounded-full py-2 text-sm font-medium"
                                            >
                                                Register
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}

export default Navbar;