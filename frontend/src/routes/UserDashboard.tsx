import { useState, useEffect } from "react"
import { Home, Search, UserPlus, Shield, User, Store, Mail, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { AdminSidebar } from "@/components/Sidebar"
import { notifyError, notifySuccess } from "@/components/toast"
import PaginationControls from "@/components/AdminDashboard.tsx/PaginationControls"
import { getAllUsers } from "@/services/userServices"
import { addEmployee, editEmployee, deleteEmployee } from "@/services/employeeServices"
import { addAdmin } from "@/services/adminServices"
import formatDate from "@/components/utils/formatDate"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface UserData {
    _id: string
    email: string
    role: "admin" | "user" | "organization" | "employee"
    userId: string
    createdAt: string
    updatedAt?: string
    __v?: number
    name?: string
}

interface Pagination {
    currentPage: number
    totalPages: number
    totalUsers: number
    hasNextPage: boolean
    hasPrevPage: boolean
    nextPage: number | null
    prevPage: number | null
    limit: number
    skip: number
}

interface Filters {
    search: string | null
    sortBy: string
    sortOrder: string
}

interface UsersResponse {
    users: UserData[]
    pagination: Pagination
    filters: Filters
}

interface EmployeeFormData {
    fullName: string
    email: string
    password: string
}

interface AdminFormData {
    email: string
    password: string
}

export default function UsersDashboard() {
    const [usersData, setUsersData] = useState<UsersResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [sortBy, setSortBy] = useState("createdAt")
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("desc")
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
    const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false)
    const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false)
    const [isEditEmployeeDialogOpen, setIsEditEmployeeDialogOpen] = useState(false)
    const [employeeFormData, setEmployeeFormData] = useState<EmployeeFormData>({
        fullName: "",
        email: "",
        password: "",
    })
    const [adminFormData, setAdminFormData] = useState<AdminFormData>({
        email: "",
        password: "",
    })
    const [selectedEmployee, setSelectedEmployee] = useState<UserData | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm])

    useEffect(() => {
        if (debouncedSearchTerm !== searchTerm) {
            setCurrentPage(1)
        }
    }, [debouncedSearchTerm])

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoading(true)
                const data = await getAllUsers({
                    page: currentPage,
                    limit: itemsPerPage,
                    search: debouncedSearchTerm || undefined,
                    sortBy,
                    sortOrder
                })
                setUsersData(data)
            } catch (error) {
                console.error("Failed to fetch users:", error)
                notifyError("Failed to load users")
                setUsersData(null)
            } finally {
                setIsLoading(false)
            }
        }

        fetchUsers()
    }, [currentPage, debouncedSearchTerm, itemsPerPage, sortBy, sortOrder])

    const getInitials = (name: string, email: string) => {
        if (name) {
            return name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
        }
        return email.charAt(0).toUpperCase()
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "admin":
                return (
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                    </Badge>
                )
            case "organization":
                return (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        <Store className="h-3 w-3 mr-1" />
                        Organization
                    </Badge>
                )
            case "employee":
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <User className="h-3 w-3 mr-1" />
                        Employee
                    </Badge>
                )
            default:
                return (
                    <Badge variant="outline">
                        <User className="h-3 w-3 mr-1" />
                        User
                    </Badge>
                )
        }
    }

    const getUserCounts = () => {
        if (!usersData) return { total: 0, admins: 0, users: 0, organizations: 0, employees: 0 }

        const total = usersData.pagination.totalUsers
        const admins = usersData.users.filter((u) => u.role === "admin").length
        const users = usersData.users.filter((u) => u.role === "user").length
        const organizations = usersData.users.filter((u) => u.role === "organization").length
        const employees = usersData.users.filter((u) => u.role === "employee").length

        return { total, admins, users, organizations, employees }
    }

    const getFilteredUsers = (role: "admin" | "user" | "organization" | "employee") => {
        if (!usersData) return []
        return usersData.users.filter((user) => user.role === role)
    }

    const handleAddEmployee = async () => {
        if (!employeeFormData.fullName.trim() || !employeeFormData.email.trim() || !employeeFormData.password.trim()) {
            notifyError("Please fill in all required fields")
            return
        }

        setIsSubmitting(true)
        try {
            await addEmployee(employeeFormData)
            notifySuccess("Employee added successfully")
            setIsAddEmployeeDialogOpen(false)
            setEmployeeFormData({ fullName: "", email: "", password: "" })
            const data = await getAllUsers({
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearchTerm || undefined,
                sortBy,
                sortOrder
            })
            setUsersData(data)
        } catch (error) {
            notifyError("Failed to add employee")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleAddAdmin = async () => {
        if (!adminFormData.email.trim() || !adminFormData.password.trim()) {
            notifyError("Please fill in all required fields")
            return
        }

        setIsSubmitting(true)
        try {
            await addAdmin(adminFormData.email, adminFormData.password )
            notifySuccess("Admin added successfully")
            setIsAddAdminDialogOpen(false)
            setAdminFormData({ email: "", password: "" })
            const data = await getAllUsers({
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearchTerm || undefined,
                sortBy,
                sortOrder
            })
            setUsersData(data)
        } catch (error) {
            if (error && typeof error === "object" && "message" in error) {
                notifyError((error as { message: string }).message || "Failed to add admin")
            } else {
                notifyError("Failed to add admin")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditEmployee = async () => {
        if (!selectedEmployee || !employeeFormData.fullName.trim() || !employeeFormData.email.trim()) {
            notifyError("Please fill in all required fields")
            return
        }

        setIsSubmitting(true)
        try {
            await editEmployee(selectedEmployee.userId, {
                fullName: employeeFormData.fullName,
                email: employeeFormData.email,
                password: employeeFormData.password || undefined,
            })
            notifySuccess("Employee updated successfully")
            setIsEditEmployeeDialogOpen(false)
            setEmployeeFormData({ fullName: "", email: "", password: "" })
            setSelectedEmployee(null)
            const data = await getAllUsers({
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearchTerm || undefined,
                sortBy,
                sortOrder
            })
            setUsersData(data)
        } catch (error) {
            notifyError("Failed to update employee")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteEmployee = async (email: string) => {
        setIsSubmitting(true)
        try {
            await deleteEmployee(email)
            notifySuccess("Employee deleted successfully")
            const data = await getAllUsers({
                page: currentPage,
                limit: itemsPerPage,
                search: debouncedSearchTerm || undefined,
                sortBy,
                sortOrder
            })
            setUsersData(data)
        } catch (error) {
            notifyError("Failed to delete employee")
        } finally {
            setIsSubmitting(false)
        }
    }

    const openEditEmployeeDialog = (user: UserData) => {
        setSelectedEmployee(user)
        setEmployeeFormData({
            fullName: user.name || "",
            email: user.email,
            password: "",
        })
        setIsEditEmployeeDialogOpen(true)
    }

    const userCounts = getUserCounts()
    const adminUsers = getFilteredUsers("admin")
    const regularUsers = getFilteredUsers("user")
    const organizationUsers = getFilteredUsers("organization")
    const employeeUsers = getFilteredUsers("employee")

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleSearch = (value: string) => {
        setSearchTerm(value)
        setCurrentPage(1)
    }

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('asc')
        }
        setCurrentPage(1)
    }

    const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
        <th
            className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center justify-between">
                {children}
                {sortBy === field && (
                    <span className="ml-1 text-xs">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                )}
            </div>
        </th>
    )

    const UserTable = ({ users, title, emptyMessage }: { users: UserData[]; title: string; emptyMessage: string }) => (
        <Card className="border-none shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>{title}</span>
                    <Badge variant="outline">{users.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {users.length === 0 ? (
                    <div className="text-center py-8">
                        <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700">{emptyMessage}</h3>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                        <SortableHeader field="name">User</SortableHeader>
                                        <SortableHeader field="email">Email</SortableHeader>
                                        <th className="px-4 py-3">Role</th>
                                        <SortableHeader field="createdAt">Created</SortableHeader>
                                        {title === "Employees" && <th className="px-4 py-3">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Avatar className="h-10 w-10 mr-3">
                                                        <AvatarFallback className="bg-blue-100 text-blue-600">
                                                            {getInitials(user.name || "", user.email)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{user.name || "No Name"}</div>
                                                        <div className="text-xs text-gray-500">ID: {user.userId.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center">
                                                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(user.createdAt)}
                                            </td>
                                            {title === "Employees" && (
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openEditEmployeeDialog(user)}
                                                        >
                                                            <Edit className="h-4 w-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                                            onClick={() => handleDeleteEmployee(user.email)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {users.map((user) => (
                                <Card key={user._id} className="border border-gray-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center">
                                                <Avatar className="h-10 w-10 mr-3">
                                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                                        {getInitials(user.name || "", user.email)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-medium">{user.name || "No Name"}</h3>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                            {getRoleBadge(user.role)}
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">User ID:</span>
                                                <span className="font-mono text-xs">{user.userId.substring(0, 16)}...</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Created:</span>
                                                <span>{formatDate(user.createdAt)}</span>
                                            </div>
                                        </div>
                                        {title === "Employees" && (
                                            <div className="mt-4 pt-3 border-t flex flex-col space-y-2">
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1"
                                                        onClick={() => openEditEmployeeDialog(user)}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                                        onClick={() => handleDeleteEmployee(user.email)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )

    return (
        <div className="flex h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Home className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-medium">Users Management</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => setIsAddEmployeeDialogOpen(true)}
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Employee
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={() => setIsAddAdminDialogOpen(true)}
                        >
                            <Shield className="h-4 w-4 mr-2" />
                            Add Admin
                        </Button>
                        <span className="text-sm text-gray-600">Admin User</span>
                        <Avatar>
                            <AvatarImage src="/placeholder.svg" alt="Admin" />
                            <AvatarFallback>AU</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="grid gap-6 md:grid-cols-5">
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>Total Users</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <User className="h-6 w-6 text-blue-500 mr-1" />
                                        {usersData?.pagination.totalUsers || 0}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>Administrators</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <Shield className="h-6 w-6 text-purple-500 mr-1" />
                                        {userCounts.admins}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>Regular Users</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <User className="h-6 w-6 text-green-500 mr-1" />
                                        {userCounts.users}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>Organizations</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <Store className="h-6 w-6 text-blue-500 mr-1" />
                                        {userCounts.organizations}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>Employees</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <User className="h-6 w-6 text-teal-500 mr-1" />
                                        {userCounts.employees}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </div>

                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <div>
                                        <CardTitle>User Directory</CardTitle>
                                        <CardDescription>
                                            Manage system users and administrators
                                            {debouncedSearchTerm && (
                                                <span className="ml-2 text-blue-600">
                                                    • Searching for "{debouncedSearchTerm}"
                                                </span>
                                            )}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                        <div className="relative w-full sm:w-80">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                placeholder="Search users..."
                                                value={searchTerm}
                                                onChange={(e) => handleSearch(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        {isLoading && (
                                            <div className="flex items-center justify-center w-8 h-8">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : !usersData || usersData.users.length === 0 ? (
                            <Card className="border-none shadow-lg">
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <User className="h-16 w-16 text-gray-300 mb-4" />
                                    <h3 className="text-xl font-medium text-gray-700 mb-2">No Users Found</h3>
                                    <p className="text-gray-500 text-center mb-6 max-w-md">
                                        {debouncedSearchTerm ? "Try adjusting your search terms" : "No users have been registered yet"}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-6">
                                {usersData && (
                                    <div className="text-sm text-gray-600 px-1">
                                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, usersData.pagination.totalUsers)} of {usersData.pagination.totalUsers} users
                                        {debouncedSearchTerm && (
                                            <span className="ml-2">
                                                for "{debouncedSearchTerm}"
                                            </span>
                                        )}
                                    </div>
                                )}

                                {adminUsers.length > 0 && (
                                    <UserTable users={adminUsers} title="Administrators" emptyMessage="No administrators found" />
                                )}

                                {organizationUsers.length > 0 && (
                                    <UserTable users={organizationUsers} title="Organizations" emptyMessage="No organizations found" />
                                )}

                                {employeeUsers.length > 0 && (
                                    <UserTable users={employeeUsers} title="Employees" emptyMessage="No employees found" />
                                )}

                                {regularUsers.length > 0 && (
                                    <UserTable users={regularUsers} title="Regular Users" emptyMessage="No regular users found" />
                                )}

                                {usersData && usersData.pagination.totalPages > 1 && (
                                    <Card className="border-none shadow-lg">
                                        <CardContent className="p-0">
                                            <PaginationControls
                                                currentPage={usersData.pagination.currentPage}
                                                totalPages={usersData.pagination.totalPages}
                                                hasNext={usersData.pagination.hasNextPage}
                                                hasPrev={usersData.pagination.hasPrevPage}
                                                onPageChange={handlePageChange}
                                                totalCount={usersData.pagination.totalUsers}
                                                limit={usersData.pagination.limit}
                                            />
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
                <DialogContent className="bg-slate-100">
                    <DialogHeader>
                        <DialogTitle>Add Employee</DialogTitle>
                        <DialogDescription>
                            Enter the details for the new employee.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                placeholder="Enter full name"
                                value={employeeFormData.fullName}
                                onChange={(e) => setEmployeeFormData({ ...employeeFormData, fullName: e.target.value })}
                                className="bg-gray-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter email"
                                value={employeeFormData.email}
                                onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                                className="bg-gray-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter password"
                                value={employeeFormData.password}
                                onChange={(e) => setEmployeeFormData({ ...employeeFormData, password: e.target.value })}
                                className="bg-gray-200"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddEmployeeDialogOpen(false)
                                setEmployeeFormData({ fullName: "", email: "", password: "" })
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleAddEmployee}
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                        >
                            {isSubmitting ? "Adding..." : "Add Employee"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddAdminDialogOpen} onOpenChange={setIsAddAdminDialogOpen}>
                <DialogContent className="bg-slate-100">
                    <DialogHeader>
                        <DialogTitle>Add Admin</DialogTitle>
                        <DialogDescription>
                            Enter the details for the new admin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="adminEmail">Email</Label>
                            <Input
                                id="adminEmail"
                                type="email"
                                placeholder="Enter email"
                                value={adminFormData.email}
                                onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                                className="bg-gray-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="adminPassword">Password</Label>
                            <Input
                                id="adminPassword"
                                type="password"
                                placeholder="Enter password"
                                value={adminFormData.password}
                                onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                                className="bg-gray-200"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAddAdminDialogOpen(false)
                                setAdminFormData({ email: "", password: "" })
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleAddAdmin}
                            disabled={isSubmitting}
                            className="bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500"
                        >
                            {isSubmitting ? "Adding..." : "Add Admin"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditEmployeeDialogOpen} onOpenChange={setIsEditEmployeeDialogOpen}>
                <DialogContent className="bg-slate-100">
                    <DialogHeader>
                        <DialogTitle>Edit Employee</DialogTitle>
                        <DialogDescription>
                            Update the details for the employee.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                placeholder="Enter full name"
                                value={employeeFormData.fullName}
                                onChange={(e) => setEmployeeFormData({ ...employeeFormData, fullName: e.target.value })}
                                className="bg-gray-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter email"
                                value={employeeFormData.email}
                                onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                                className="bg-gray-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password (Optional)</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter new password (leave blank to keep current)"
                                value={employeeFormData.password}
                                onChange={(e) => setEmployeeFormData({ ...employeeFormData, password: e.target.value })}
                                className="bg-gray-200"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditEmployeeDialogOpen(false)
                                setEmployeeFormData({ fullName: "", email: "", password: "" })
                                setSelectedEmployee(null)
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleEditEmployee}
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                        >
                            {isSubmitting ? "Updating..." : "Update Employee"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}