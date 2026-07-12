"use client"

import type React from "react"
import { useState } from "react"
import { Eye, EyeOff, Mail, Lock,
    Save,
    // Shield,UserPlus,
    Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { notifyError, notifySuccess } from "@/components/toast"
import { AdminSidebar } from "@/components/Sidebar"
import { changeEmail, changePassword } from "@/services/settingsServices"
import useAuthStore from "@/store/authStore"

interface ChangeEmailForm {
    currentEmail: string
    newEmail: string
    confirmEmail: string
    password: string
}

interface ChangePasswordForm {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

// interface AddAdminForm {
//     name: string
//     email: string
//     password: string
//     confirmPassword: string
//     role: string
//     phone: string
// }

export default function SettingsPage() {
    const { user, updateUser } = useAuthStore()

    const [showPasswords, setShowPasswords] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
        adminPassword: false,
        adminConfirmPassword: false,
    })

    const [emailForm, setEmailForm] = useState<ChangeEmailForm>({
        currentEmail: user?.email || "",
        newEmail: "",
        confirmEmail: "",
        password: "",
    })

    const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    })

    // const [adminForm, setAdminForm] = useState<AddAdminForm>({
    //     name: "",
    //     email: "",
    //     password: "",
    //     confirmPassword: "",
    //     role: "",
    //     phone: "",
    // })

    const [isLoading, setIsLoading] = useState({
        email: false,
        password: false,
        admin: false,
    })

    const togglePasswordVisibility = (field: string) => {
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field as keyof typeof prev],
        }))
    }

    const handleEmailChange = async (e: React.FormEvent) => {
        e.preventDefault()

        if (emailForm.newEmail !== emailForm.confirmEmail) {
            notifyError("New email addresses do not match")
            return
        }

        if (!emailForm.password) {
            notifyError("Please enter your current password")
            return
        }

        setIsLoading((prev) => ({ ...prev, email: true }))

        try {
            await changeEmail({
                currentPassword: emailForm.password,
                email: emailForm.newEmail,
            })

            notifySuccess("Email changed successfully!")
            updateUser({ email: emailForm.newEmail })
            setEmailForm({
                currentEmail: emailForm.newEmail,
                newEmail: "",
                confirmEmail: "",
                password: "",
            })
        } catch (error: any) {
            notifyError(error.response?.data?.message || "Failed to change email")
        } finally {
            setIsLoading((prev) => ({ ...prev, email: false }))
        }
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            notifyError("New passwords do not match")
            return
        }

        if (passwordForm.newPassword.length < 8) {
            notifyError("New password must be at least 8 characters long")
            return
        }

        setIsLoading((prev) => ({ ...prev, password: true }))

        try {
            await changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            })

            notifySuccess("Password changed successfully!")
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            })
        } catch (error: any) {
            notifyError(error.response?.data?.message || "Failed to change password")
        } finally {
            setIsLoading((prev) => ({ ...prev, password: false }))
        }
    }

    // const handleAddAdmin = async (e: React.FormEvent) => {
    //     e.preventDefault()
    //
    //     if (adminForm.password !== adminForm.confirmPassword) {
    //         // notifyError("Passwords do not match")
    //         return
    //     }
    //
    //     if (adminForm.password.length < 8) {
    //         // notifyError("Password must be at least 8 characters long")
    //         return
    //     }
    //
    //     if (!adminForm.role) {
    //         // notifyError("Please select a role")
    //         return
    //     }
    //
    //     setIsLoading((prev) => ({ ...prev, admin: true }))
    //
    //     try {
    //         const response = await fetch("/api/admin/add-admin", {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({
    //                 name: adminForm.name,
    //                 email: adminForm.email,
    //                 password: adminForm.password,
    //                 role: adminForm.role,
    //                 phone: adminForm.phone,
    //             }),
    //         })
    //
    //         if (response.ok) {
    //             // notifySuccess("Admin user created successfully!")
    //             setAdminForm({
    //                 name: "",
    //                 email: "",
    //                 password: "",
    //                 confirmPassword: "",
    //                 role: "",
    //                 phone: "",
    //             })
    //         } else {
    //             // const error = await response.json()
    //             // notifyError(error.message || "Failed to create admin user")
    //         }
    //     } catch (error) {
    //         // notifyError("An error occurred while creating admin user")
    //     } finally {
    //         setIsLoading((prev) => ({ ...prev, admin: false }))
    //     }
    // }

    return (
        <div className="flex h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Home className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-medium">Settings</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{user?.name || "Admin User"}</span>
                        <Avatar>
                            <AvatarImage src={user?.avatar || "/placeholder.svg"} alt="Admin" />
                            <AvatarFallback>{user?.name ? user.name.charAt(0).toUpperCase() : "AU"}</AvatarFallback>
                        </Avatar>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="space-y-4 p-4 md:p-8 pt-6">
                            <div className="flex items-center justify-between space-y-2">
                                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                            </div>

                            <div className="grid gap-6">
                                {/* Change Email Section */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Mail className="h-5 w-5 mr-2 text-blue-600" />
                                            Change Email Address
                                        </CardTitle>
                                        <CardDescription>
                                            Update your email address. You'll need to verify the new email address.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleEmailChange} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="currentEmail">Current Email</Label>
                                                    <Input
                                                        id="currentEmail"
                                                        type="email"
                                                        value={emailForm.currentEmail}
                                                        disabled
                                                        className="bg-gray-50"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="newEmail">New Email</Label>
                                                    <Input
                                                        id="newEmail"
                                                        type="email"
                                                        value={emailForm.newEmail}
                                                        onChange={(e) => setEmailForm((prev) => ({ ...prev, newEmail: e.target.value }))}
                                                        placeholder="Enter new email address"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmEmail">Confirm New Email</Label>
                                                    <Input
                                                        id="confirmEmail"
                                                        type="email"
                                                        value={emailForm.confirmEmail}
                                                        onChange={(e) => setEmailForm((prev) => ({ ...prev, confirmEmail: e.target.value }))}
                                                        placeholder="Confirm new email address"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <Button type="submit" disabled={isLoading.email} className="bg-blue-600 hover:bg-blue-700">
                                                {isLoading.email ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        Update Email
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                {/* Change Password Section */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Lock className="h-5 w-5 mr-2 text-green-600" />
                                            Change Password
                                        </CardTitle>
                                        <CardDescription>Update your password. Make sure it's strong and unique.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handlePasswordChange} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="currentPassword">Current Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="currentPassword"
                                                            type={showPasswords.currentPassword ? "text" : "password"}
                                                            value={passwordForm.currentPassword}
                                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                                                            placeholder="Enter current password"
                                                            required
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() => togglePasswordVisibility("currentPassword")}
                                                        >
                                                            {showPasswords.currentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="newPassword">New Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="newPassword"
                                                            type={showPasswords.newPassword ? "text" : "password"}
                                                            value={passwordForm.newPassword}
                                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                                                            placeholder="Enter new password"
                                                            required
                                                            minLength={8}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() => togglePasswordVisibility("newPassword")}
                                                        >
                                                            {showPasswords.newPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="confirmPassword"
                                                            type={showPasswords.confirmPassword ? "text" : "password"}
                                                            value={passwordForm.confirmPassword}
                                                            onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                                            placeholder="Confirm new password"
                                                            required
                                                            minLength={8}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() => togglePasswordVisibility("confirmPassword")}
                                                        >
                                                            {showPasswords.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                <p>Password requirements:</p>
                                                <ul className="list-disc list-inside mt-1 space-y-1">
                                                    <li>At least 8 characters long</li>
                                                    <li>Include uppercase and lowercase letters</li>
                                                    <li>Include at least one number</li>
                                                    <li>Include at least one special character</li>
                                                </ul>
                                            </div>
                                            <Button type="submit" disabled={isLoading.password} className="bg-green-600 hover:bg-green-700">
                                                {isLoading.password ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        Update Password
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                <Separator />

                                {/* Add Admin Section */}
                                {/* <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <UserPlus className="h-5 w-5 mr-2 text-purple-600" />
                                            Add New Admin User
                                        </CardTitle>
                                        <CardDescription>Create a new admin user account with specific roles and permissions.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleAddAdmin} className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="adminName">Full Name</Label>
                                                    <Input
                                                        id="adminName"
                                                        type="text"
                                                        value={adminForm.name}
                                                        onChange={(e) => setAdminForm((prev) => ({ ...prev, name: e.target.value }))}
                                                        placeholder="Enter full name"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="adminEmail">Email Address</Label>
                                                    <Input
                                                        id="adminEmail"
                                                        type="email"
                                                        value={adminForm.email}
                                                        onChange={(e) => setAdminForm((prev) => ({ ...prev, email: e.target.value }))}
                                                        placeholder="Enter email address"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="adminPhone">Phone Number</Label>
                                                    <Input
                                                        id="adminPhone"
                                                        type="tel"
                                                        value={adminForm.phone}
                                                        onChange={(e) => setAdminForm((prev) => ({ ...prev, phone: e.target.value }))}
                                                        placeholder="Enter phone number"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="adminRole">Role</Label>
                                                    <Select
                                                        value={adminForm.role}
                                                        onValueChange={(value) => setAdminForm((prev) => ({ ...prev, role: value }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select admin role" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="super_admin">
                                                                <div className="flex items-center">
                                                                    <Shield className="h-4 w-4 mr-2 text-red-500" />
                                                                    Super Admin
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="admin">
                                                                <div className="flex items-center">
                                                                    <Shield className="h-4 w-4 mr-2 text-blue-500" />
                                                                    Admin
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="moderator">
                                                                <div className="flex items-center">
                                                                    <Shield className="h-4 w-4 mr-2 text-green-500" />
                                                                    Moderator
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="viewer">
                                                                <div className="flex items-center">
                                                                    <Shield className="h-4 w-4 mr-2 text-gray-500" />
                                                                    Viewer
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="adminPassword">Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="adminPassword"
                                                            type={showPasswords.adminPassword ? "text" : "password"}
                                                            value={adminForm.password}
                                                            onChange={(e) => setAdminForm((prev) => ({ ...prev, password: e.target.value }))}
                                                            placeholder="Enter password"
                                                            required
                                                            minLength={8}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() => togglePasswordVisibility("adminPassword")}
                                                        >
                                                            {showPasswords.adminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="adminConfirmPassword">Confirm Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="adminConfirmPassword"
                                                            type={showPasswords.adminConfirmPassword ? "text" : "password"}
                                                            value={adminForm.confirmPassword}
                                                            onChange={(e) => setAdminForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                                                            placeholder="Confirm password"
                                                            required
                                                            minLength={8}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() => togglePasswordVisibility("adminConfirmPassword")}
                                                        >
                                                            {showPasswords.adminConfirmPassword ? (
                                                                <EyeOff className="h-4 w-4" />
                                                            ) : (
                                                                <Eye className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                <h4 className="font-medium text-blue-800 mb-2">Role Permissions:</h4>
                                                <div className="text-sm text-blue-700 space-y-1">
                                                    <p>
                                                        <strong>Super Admin:</strong> Full system access, can manage all admins
                                                    </p>
                                                    <p>
                                                        <strong>Admin:</strong> Manage events, bookings, users, and content
                                                    </p>
                                                    <p>
                                                        <strong>Moderator:</strong> Manage bookings and user support
                                                    </p>
                                                    <p>
                                                        <strong>Viewer:</strong> Read-only access to reports and data
                                                    </p>
                                                </div>
                                            </div>

                                            <Button type="submit" disabled={isLoading.admin} className="bg-purple-600 hover:bg-purple-700">
                                                {isLoading.admin ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus className="h-4 w-4 mr-2" />
                                                        Create Admin User
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card> */}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}