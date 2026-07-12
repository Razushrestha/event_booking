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
import { Textarea } from "@/components/ui/textarea"
import { AdminSidebar } from "@/components/Sidebar"
import { notifyError, notifySuccess } from "@/components/toast"
import { getServices, createService, updateService, deleteService } from "@/services/serviceServices"

interface ServiceData {
    _id: string
    serviceId: string
    name: string
    description: string
    image: string | null
    createdAt: string
    updatedAt: string
}

export default function ServicesDashboard() {
    const imageUrl = import.meta.env.VITE_IMAGE_URL || "http://localhost:5000/images/"
    const [services, setServices] = useState<ServiceData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedService, setSelectedService] = useState<ServiceData | null>(null)
    const [formData, setFormData] = useState({ name: "", description: "" })
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)
    const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())

    // Fetch services
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const response = await getServices()
                console.log("Fetched services:", response.data)
                setServices(response.data || [])
            } catch (error) {
                notifyError("Failed to load services")
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

    const getImageUrl = (imagePath: string | null) => {
        if (!imagePath) return null
        if (imagePath.startsWith('http')) return imagePath
        return `${imageUrl}${imagePath}`
    }

    const openCreateModal = () => {
        setFormData({ name: "", description: "" })
        setImageFile(null)
        setImagePreview(null)
        setIsEditing(false)
        setIsModalOpen(true)
    }

    const openEditModal = (service: ServiceData) => {
        setSelectedService(service)
        setFormData({ name: service.name, description: service.description })
        setImageFile(null)
        setImagePreview(getImageUrl(service.image))
        setIsEditing(true)
        setIsModalOpen(true)
    }

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
            data.append('description', formData.description)
            if (imageFile) {
                data.append('image', imageFile)
            }

            if (isEditing && selectedService) {
                let response = await updateService(selectedService.serviceId, data)
                response = response.data || response
                const updatedService: ServiceData = {
                    _id: response._id || response.serviceId || selectedService._id,
                    serviceId: response.serviceId || response._id || selectedService.serviceId,
                    name: response.name || formData.name,
                    description: response.description || formData.description,
                    image: response.image || selectedService.image,
                    createdAt: response.createdAt || selectedService.createdAt,
                    updatedAt: response.updatedAt || new Date().toISOString(),
                }
                setServices(services =>
                    services.map(s => s.serviceId === selectedService.serviceId ? updatedService : s)
                )
                notifySuccess("Service updated successfully")
            } else {
                let response = await createService(data)
                console.log("Create service response:", response)
                response = response.data || response
                const newService: ServiceData = {
                    _id: response._id || response.serviceId || `temp-${Date.now()}`,
                    serviceId: response.serviceId || response._id || `temp-${Date.now()}`,
                    name: response.name || formData.name,
                    description: response.description || formData.description,
                    image: response.image || null,
                    createdAt: response.createdAt || new Date().toISOString(),
                    updatedAt: response.updatedAt || new Date().toISOString(),
                }
                setServices(services => [...services, newService])
                notifySuccess("Service created successfully")
            }
            setIsModalOpen(false)
            setImageFile(null)
            setImagePreview(null)
            setSelectedService(null)
            setFormData({ name: "", description: "" })
        } catch (error: any) {
            console.error("Error in handleSubmit:", error)
            notifyError(isEditing ? "Failed to update service" : "Failed to create service")
        }
    }

    const openDeleteDialog = (id: string) => {
        setServiceToDelete(id)
        setIsDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        if (serviceToDelete) {
            try {
                await deleteService(serviceToDelete)
                setServices(services => services.filter(s => s.serviceId !== serviceToDelete))
                notifySuccess("Service deleted successfully")
            } catch (error) {
                notifyError("Failed to delete service")
            } finally {
                setIsDeleteDialogOpen(false)
                setServiceToDelete(null)
            }
        }
    }

    const handleImageError = (serviceId: string) => {
        setImageLoadErrors(prev => new Set(prev).add(serviceId))
    }

    const ImageDisplay = ({ service, className = "h-32 w-32" }: { service: ServiceData, className?: string }) => {
        const imageUrl = getImageUrl(service.image)
        const hasError = imageLoadErrors.has(service.serviceId)

        if (!imageUrl || hasError) {
            return (
                <div className={`${className} bg-red-100 rounded flex items-center justify-center`}>
                    <X className="h-4 w-4 text-red-500" />
                </div>
            )
        }

        return (
            <img
                src={imageUrl}
                alt={service.name}
                className={`${className} object-cover rounded`}
                onError={() => handleImageError(service.serviceId)}
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
                        <h2 className="text-lg font-medium">Services Management</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" onClick={openCreateModal}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Service
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
                        {/* Services List */}
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <CardTitle>All Services</CardTitle>
                                <CardDescription>Manage and review services</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : services.length === 0 ? (
                                    <div className="text-center py-12">
                                        <h3 className="text-lg font-medium text-gray-700">No services found</h3>
                                        <p className="text-gray-500">No services have been created yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                        <th className="px-4 py-3">Service</th>
                                                        <th className="px-4 py-3">Description</th>
                                                        <th className="px-4 py-3">Image</th>
                                                        <th className="px-4 py-3">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {services.map((service) => (
                                                        <tr key={service.serviceId} className="hover:bg-gray-50">
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <Avatar className="h-8 w-8 mr-3">
                                                                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                                                            {getInitials(service.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="font-medium text-gray-900">{service.name}</div>
                                                                        <div className="text-xs text-gray-500">ID: {service.serviceId.substring(0, 8)}...</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">{service.description}</td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <ImageDisplay service={service} />
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="mr-2"
                                                                    onClick={() => openEditModal(service)}
                                                                >
                                                                    <Edit className="h-4 w-4 mr-1" />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    className="bg-red-600 text-white hover:bg-red-700"
                                                                    onClick={() => openDeleteDialog(service.serviceId)}
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
                                            {services.map((service) => (
                                                <Card key={service.serviceId} className="border border-gray-200">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center">
                                                                <Avatar className="h-10 w-10 mr-3">
                                                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                                                        {getInitials(service.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <h3 className="font-medium">{service.name}</h3>
                                                                    <p className="text-sm text-gray-500">ID: {service.serviceId.substring(0, 8)}...</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            <div>
                                                                <span className="text-gray-500">Description:</span>
                                                                <p>{service.description}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-500">Image:</span>
                                                                <div className="mt-2">
                                                                    <ImageDisplay service={service} className="h-16 w-16" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 pt-3 border-t flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full"
                                                                onClick={() => openEditModal(service)}
                                                            >
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="w-full bg-red-600 text-white hover:bg-red-700"
                                                                onClick={() => openDeleteDialog(service.serviceId)}
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
                        <DialogTitle>{isEditing ? "Edit Service" : "Create Service"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleFormChange}
                                placeholder="Enter service name"
                                className="bg-gray-50 border-gray-300"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleFormChange}
                                placeholder="Enter service description"
                                className="bg-gray-50 border-gray-300"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="image">Image</Label>
                            <Input
                                id="image"
                                name="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="bg-gray-50 border-gray-300"
                            />
                            {imagePreview && (
                                <div className="mt-2">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="h-20 w-20 object-cover rounded border"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsModalOpen(false)
                                setImagePreview(null)
                                setImageFile(null)
                                setFormData({ name: "", description: "" })
                                setSelectedService(null)
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
                        <p className="text-gray-600">Are you sure you want to delete this service? This action cannot be undone.</p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteDialogOpen(false)
                                setServiceToDelete(null)
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