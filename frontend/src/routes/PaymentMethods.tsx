import { useState, useEffect } from "react"
import {
    Home,
    Edit,
    Trash2,
    Plus,
    X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AdminSidebar } from "@/components/Sidebar"
import { notifyError, notifySuccess } from "@/components/toast"
import { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod } from "@/services/paymentMethodServices"

interface PaymentMethodData {
    _id: string
    paymentMethodId: string
    name: string
    image: string | null
    createdAt: string
    updatedAt: string
}

export default function PaymentMethodsDashboard() {
    const imageUrl = import.meta.env.VITE_IMAGE_URL || "http://localhost:5000/images/"
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodData | null>(null)
    const [formData, setFormData] = useState({ name: "" })
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [paymentMethodToDelete, setPaymentMethodToDelete] = useState<string | null>(null)
    const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())

    // Fetch payment methods
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const response = await getPaymentMethods()
                console.log("Fetched payment methods:", response.data)
                setPaymentMethods(response.data || [])
            } catch (error) {
                notifyError("Failed to load payment methods")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const getImageUrl = (image: string | null) => {
        if (!image || image === '') return null
        return image.startsWith('http') ? image : `${imageUrl}${image}`
    }

    const openCreateModal = () => {
        setFormData({ name: "" })
        setImageFile(null)
        setImagePreview(null)
        setIsEditing(false)
        setIsModalOpen(true)
    }

    const openEditModal = (paymentMethod: PaymentMethodData) => {
        setSelectedPaymentMethod(paymentMethod)
        setFormData({ name: paymentMethod.name })
        setImageFile(null)
        setImagePreview(getImageUrl(paymentMethod.image))
        setIsEditing(true)
        setIsModalOpen(true)
    }

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async () => {
        try {
            const data = new FormData()
            data.append('name', formData.name)
            if (imageFile) {
                data.append('image', imageFile)
            }

            if (isEditing && selectedPaymentMethod) {
                let response = await updatePaymentMethod(selectedPaymentMethod.paymentMethodId, data)
                response = response.data || response
                const updatedPaymentMethod: PaymentMethodData = {
                    _id: response._id || response.paymentMethodId || selectedPaymentMethod._id,
                    paymentMethodId: response.paymentMethodId || response._id || selectedPaymentMethod.paymentMethodId,
                    name: response.name || formData.name,
                    image: response.image || selectedPaymentMethod.image,
                    createdAt: response.createdAt || selectedPaymentMethod.createdAt,
                    updatedAt: response.updatedAt || new Date().toISOString(),
                }
                setPaymentMethods(paymentMethods =>
                    paymentMethods.map(pm => pm.paymentMethodId === selectedPaymentMethod.paymentMethodId ? updatedPaymentMethod : pm)
                )
                notifySuccess("Payment method updated successfully")
            } else {
                let response = await createPaymentMethod(data)
                response = response.data || response
                console.log("Create payment method response:", response)
                const newPaymentMethod: PaymentMethodData = {
                    _id: response._id || response.paymentMethodId || `temp-${Date.now()}`,
                    paymentMethodId: response.paymentMethodId || response._id || `temp-${Date.now()}`,
                    name: response.name || formData.name,
                    image: response.image || null,
                    createdAt: response.createdAt || new Date().toISOString(),
                    updatedAt: response.updatedAt || new Date().toISOString(),
                }
                setPaymentMethods(paymentMethods => [...paymentMethods, newPaymentMethod])
                notifySuccess("Payment method created successfully")
            }
            setIsModalOpen(false)
            setImageFile(null)
            setImagePreview(null)
            setSelectedPaymentMethod(null)
            setFormData({ name: "" })
        } catch (error: any) {
            console.error("Error in handleSubmit:", error)
            notifyError(isEditing ? "Failed to update payment method" : "Failed to create payment method")
        }
    }

    const openDeleteDialog = (id: string) => {
        setPaymentMethodToDelete(id)
        setIsDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        if (paymentMethodToDelete) {
            try {
                await deletePaymentMethod(paymentMethodToDelete)
                setPaymentMethods(paymentMethods => paymentMethods.filter(pm => pm.paymentMethodId !== paymentMethodToDelete))
                notifySuccess("Payment method deleted successfully")
            } catch (error) {
                notifyError("Failed to delete payment method")
            } finally {
                setIsDeleteDialogOpen(false)
                setPaymentMethodToDelete(null)
            }
        }
    }

    const handleImageError = (paymentMethodId: string) => {
        console.error(`Image failed to load for payment method ${paymentMethodId}`)
        setImageLoadErrors(prev => new Set([...prev, paymentMethodId]))
    }

    const ImageDisplay = ({ paymentMethod, size = "large" }: { paymentMethod: PaymentMethodData, size?: "small" | "large" }) => {
        const imageUrl = getImageUrl(paymentMethod.image)
        const hasLoadError = imageLoadErrors.has(paymentMethod.paymentMethodId)
        const sizeClass = size === "small" ? "h-16 w-16" : "h-48 w-48"
        
        if (!imageUrl || hasLoadError) {
            return (
                <div className={`${sizeClass} flex items-center justify-center bg-gray-100 rounded border-2 border-dashed border-gray-300`}>
                    <X className="h-8 w-8 text-gray-400" />
                </div>
            )
        }

        return (
            <img
                src={imageUrl}
                alt={paymentMethod.name}
                className={`${sizeClass} object-cover rounded border`}
                onError={() => handleImageError(paymentMethod.paymentMethodId)}
            />
        )
    }

    const PreviewImage = ({ src, alt }: { src: string | null, alt: string }) => {
        if (!src) {
            return (
                <div className="h-60 w-60 flex items-center justify-center bg-gray-100 rounded border-2 border-dashed border-gray-300">
                    <X className="h-12 w-12 text-gray-400" />
                </div>
            )
        }

        return (
            <img
                src={src}
                alt={alt}
                className="h-60 w-60 object-cover rounded border mt-2"
                onError={() => console.error('Preview image failed to load')}
            />
        )
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Home className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-medium">Payment Methods Management</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" onClick={openCreateModal}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Payment Method
                        </Button>
                        <span className="text-sm text-gray-600">Admin User</span>
                        <Avatar>
                            <AvatarFallback>AU</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Payment Methods List */}
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <CardTitle>All Payment Methods</CardTitle>
                                <CardDescription>Manage and review QR-based payment methods</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : paymentMethods.length === 0 ? (
                                    <div className="text-center py-12">
                                        <h3 className="text-lg font-medium text-gray-700">No payment methods found</h3>
                                        <p className="text-gray-500">No payment methods have been created yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                        <th className="px-4 py-3">Payment Method</th>
                                                        <th className="px-4 py-3">QR Image</th>
                                                        <th className="px-4 py-3">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {paymentMethods.map((pm) => (
                                                        <tr key={pm.paymentMethodId} className="hover:bg-gray-50">
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <Avatar className="h-8 w-8 mr-3">
                                                                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                                                            {getInitials(pm.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="font-medium text-gray-900">{pm.name}</div>
                                                                        <div className="text-xs text-gray-500">ID: {pm.paymentMethodId.substring(0, 8)}...</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <ImageDisplay paymentMethod={pm} />
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="mr-2"
                                                                    onClick={() => openEditModal(pm)}
                                                                >
                                                                    <Edit className="h-4 w-4 mr-1" />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    className="bg-red-600 text-white hover:bg-red-700"
                                                                    onClick={() => openDeleteDialog(pm.paymentMethodId)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                                    Delete
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div className="md:hidden space-y-4">
                                            {paymentMethods.map((pm) => (
                                                <Card key={pm.paymentMethodId} className="border border-gray-200">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center">
                                                                <Avatar className="h-10 w-10 mr-3">
                                                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                                                        {getInitials(pm.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <h3 className="font-medium">{pm.name}</h3>
                                                                    <p className="text-sm text-gray-500">ID: {pm.paymentMethodId.substring(0, 8)}...</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            <div>
                                                                <span className="text-gray-500 block mb-2">QR Image:</span>
                                                                <ImageDisplay paymentMethod={pm} size="small" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 pt-3 border-t flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full"
                                                                onClick={() => openEditModal(pm)}
                                                            >
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="w-full bg-red-600 text-white hover:bg-red-700"
                                                                onClick={() => openDeleteDialog(pm.paymentMethodId)}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>

            {/* Edit/Create Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Payment Method" : "Create Payment Method"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleFormChange}
                                placeholder="Enter payment method name (e.g., PayPal)"
                                className="bg-gray-50 border-gray-300"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="image">QR Image</Label>
                            <Input
                                id="image"
                                name="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="bg-gray-50 border-gray-300"
                            />
                            <PreviewImage 
                                src={imagePreview} 
                                alt="Preview QR" 
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsModalOpen(false)
                                setImagePreview(null)
                                setImageFile(null)
                                setFormData({ name: "" })
                                setSelectedPaymentMethod(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} className="bg-blue-600 text-white hover:bg-blue-700">
                            {isEditing ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600">Are you sure you want to delete this payment method? This action cannot be undone.</p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteDialogOpen(false)
                                setPaymentMethodToDelete(null)
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}