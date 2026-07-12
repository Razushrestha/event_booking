import { useState } from "react"
import {
    User,
    Mail,
    Lock,
    Phone,
    Save,
    Eye,
    EyeOff,
    Check,
    AlertCircle,
    Settings
} from "lucide-react"
import Navbar from "@/userComponents/navbar"
import Footer from "@/userComponents/footer"
import { updateUserProfile, changeEmail, changePassword } from "@/services/settingsServices"
import useAuthStore from '@/store/authStore';

interface ProfileFormData {
    displayName: string
    phone: string
}

interface EmailFormData {
    email: string
}

interface PasswordFormData {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export default function UserSettingsPage() {
    const { user, updateUser, logout } = useAuthStore() // Added updateUser and logout
    // Profile form state
    const [profileData, setProfileData] = useState<ProfileFormData>({
        displayName: user?.name || "",
        phone: user?.phone || "",
    })
    const [profileLoading, setProfileLoading] = useState(false)
    const [profileSuccess, setProfileSuccess] = useState(false)
    const [profileError, setProfileError] = useState("")

    // Email form state
    const [emailData, setEmailData] = useState<EmailFormData>({
        email: user?.email || ""
    })
    const [emailLoading, setEmailLoading] = useState(false)
    const [emailSuccess, setEmailSuccess] = useState(false)
    const [emailError, setEmailError] = useState("")

    // Password form state
    const [passwordData, setPasswordData] = useState<PasswordFormData>({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordSuccess, setPasswordSuccess] = useState(false)
    const [passwordError, setPasswordError] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Profile form handlers
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value })
        setProfileError("")
        setProfileSuccess(false)
    }

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!profileData.displayName.trim()) {
            setProfileError("Display name is required")
            return
        }

        setProfileLoading(true)
        setProfileError("")
        setProfileSuccess(false)

        try {
            await updateUserProfile(profileData)
            // Update user in auth store
            updateUser({
                name: profileData.displayName,
                phone: profileData.phone
            })
            setProfileSuccess(true)
            setTimeout(() => setProfileSuccess(false), 3000)
        } catch (error: any) {
            setProfileError(error?.response?.data?.message || "Failed to update profile")
        } finally {
            setProfileLoading(false)
        }
    }

    // Email form handlers
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmailData({ ...emailData, [e.target.name]: e.target.value })
        setEmailError("")
        setEmailSuccess(false)
    }

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!emailData.email.trim()) {
            setEmailError("Email is required")
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(emailData.email)) {
            setEmailError("Please enter a valid email address")
            return
        }

        setEmailLoading(true)
        setEmailError("")
        setEmailSuccess(false)

        try {
            await changeEmail(emailData)
            setEmailSuccess(true)
            setTimeout(() => {
                setEmailSuccess(false)
                // Log out the user after email change
                logout()
            }, 3000)
        } catch (error: any) {
            setEmailError(error?.response?.data?.message || "Failed to update email")
        } finally {
            setEmailLoading(false)
        }
    }

    // Password form handlers
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
        setPasswordError("")
        setPasswordSuccess(false)
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!passwordData.currentPassword.trim()) {
            setPasswordError("Current password is required")
            return
        }

        if (!passwordData.newPassword.trim()) {
            setPasswordError("New password is required")
            return
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters long")
            return
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("New passwords do not match")
            return
        }

        setPasswordLoading(true)
        setPasswordError("")
        setPasswordSuccess(false)

        try {
            await changePassword(passwordData)
            setPasswordSuccess(true)
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            })
            setTimeout(() => setPasswordSuccess(false), 3000)
        } catch (error: any) {
            setPasswordError(error?.response?.data?.message || "Failed to change password")
        } finally {
            setPasswordLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-16 md:pt-24">
            <Navbar />

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center mb-4">
                        <Settings className="h-8 w-8 text-blue-600 mr-3" />
                        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                    </div>
                    <p className="text-gray-600">
                        Manage your account information, email address, and security settings.
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Profile Information Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center">
                                <User className="h-5 w-5 text-gray-400 mr-2" />
                                <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Display Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="displayName"
                                        name="displayName"
                                        value={profileData.displayName}
                                        onChange={handleProfileChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter your display name"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={profileData.phone}
                                            onChange={handleProfileChange}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Profile Messages */}
                            {profileError && (
                                <div className="mt-4 flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                                    <span className="text-sm text-red-700">{profileError}</span>
                                </div>
                            )}

                            {profileSuccess && (
                                <div className="mt-4 flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                                    <Check className="h-4 w-4 text-green-500 mr-2" />
                                    <span className="text-sm text-green-700">Profile updated successfully!</span>
                                </div>
                            )}

                            <div className="mt-6">
                                <button
                                    onClick={handleProfileSubmit}
                                    disabled={profileLoading}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {profileLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Update Profile
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Email Settings Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center">
                                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                                <h2 className="text-lg font-medium text-gray-900">Email Address</h2>
                            </div>
                        </div>

                        <form onSubmit={handleEmailSubmit} className="p-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={emailData.email}
                                    onChange={handleEmailChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your new email address"
                                />
                            </div>

                            {/* Email Messages */}
                            {emailError && (
                                <div className="mt-4 flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                                    <span className="text-sm text-red-700">{emailError}</span>
                                </div>
                            )}

                            {emailSuccess && (
                                <div className="mt-4 flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                                    <Check className="h-4 w-4 text-green-500 mr-2" />
                                    <span className="text-sm text-green-700">Email updated successfully! You will be logged out shortly.</span>
                                </div>
                            )}

                            <div className="mt-6">
                                <button
                                    type="submit"
                                    disabled={emailLoading}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {emailLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Update Email
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Password Settings Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center">
                                <Lock className="h-5 w-5 text-gray-400 mr-2" />
                                <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            id="currentPassword"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter your current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            id="newPassword"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Enter your new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Confirm your new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Password Messages */}
                            {passwordError && (
                                <div className="mt-4 flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                                    <span className="text-sm text-red-700">{passwordError}</span>
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="mt-4 flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                                    <Check className="h-4 w-4 text-green-500 mr-2" />
                                    <span className="text-sm text-green-700">Password changed successfully!</span>
                                </div>
                            )}

                            <div className="mt-6">
                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {passwordLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                            Changing...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-4 w-4 mr-2" />
                                            Change Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}