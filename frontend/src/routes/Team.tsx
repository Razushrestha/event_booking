import { useState, useEffect } from "react"
import {
    Home,
    Edit,
    Trash2,
    Plus,
    Mail,
    Facebook,
    Instagram,
    User,
    Building,
    Award
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminSidebar } from "@/components/Sidebar"
import { notifyError, notifySuccess } from "@/components/toast"
import { getTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from "@/services/teamServices"

interface TeamMemberData {
    _id: string
    teamId: string
    name: string
    position: string
    description: string | null
    photo: string | null
    email: string
    department: string | null
    hierarchyLevel: number
    socialLinks: {
        facebook: string | null
        instagram: string | null
    }
    createdAt: string
    updatedAt: string
}

interface FormData {
    name: string
    position: string
    description: string
    email: string
    department: string
    hierarchyLevel: number
    facebook: string
    instagram: string
}

const DEPARTMENTS = [
    "Director",
    "Admin",
    "Design",
    "Marketing",
    "Sales",
    "HR",
    "Finance",
    "Operations",
    "Management",
    "Other"
]

const HIERARCHY_LEVELS = [
    { value: 0, label: "Executive Level" },
    { value: 1, label: "Senior Management" },
    { value: 2, label: "Middle Management" },
    { value: 3, label: "Team Lead" },
    { value: 4, label: "Senior Staff" },
    { value: 5, label: "Staff" },
    { value: 6, label: "Junior Staff" },
    { value: 7, label: "Intern" }
]

export default function TeamDashboard() {
    const imageUrl = import.meta.env.VITE_IMAGE_URL || "http://localhost:5000/images/"
    const [teamMembers, setTeamMembers] = useState<TeamMemberData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [selectedMember, setSelectedMember] = useState<TeamMemberData | null>(null)
    const [formData, setFormData] = useState<FormData>({
        name: "",
        position: "",
        description: "",
        email: "",
        department: "",
        hierarchyLevel: 5,
        facebook: "",
        instagram: ""
    })
    const [photoFile, setPhotoFile] = useState<File | null>(null)
    const [photoPreview, setPhotoPreview] = useState<string | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [memberToDelete, setMemberToDelete] = useState<string | null>(null)
    const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())

    // Fetch team members
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const response = await getTeamMembers()
                console.log("Fetched team members:", response.data)
                setTeamMembers(response.data || [])
            } catch (error) {
                notifyError("Failed to load team members")
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

    const getImageUrl = (photoPath: string | null) => {
        if (!photoPath) return null
        if (photoPath.startsWith('http')) return photoPath
        return `${imageUrl}${photoPath}`
    }

    const getHierarchyLabel = (level: number) => {
        const hierarchy = HIERARCHY_LEVELS.find(h => h.value === level)
        return hierarchy ? hierarchy.label : `Level ${level}`
    }

    const openCreateModal = () => {
        setFormData({
            name: "",
            position: "",
            description: "",
            email: "",
            department: "",
            hierarchyLevel: 5,
            facebook: "",
            instagram: ""
        })
        setPhotoFile(null)
        setPhotoPreview(null)
        setIsEditing(false)
        setIsModalOpen(true)
    }

    const openEditModal = (member: TeamMemberData) => {
        setSelectedMember(member)
        setFormData({
            name: member.name,
            position: member.position,
            description: member.description || "",
            email: member.email,
            department: member.department || "",
            hierarchyLevel: member.hierarchyLevel,
            facebook: member.socialLinks.facebook || "",
            instagram: member.socialLinks.instagram || ""
        })
        setPhotoFile(null)
        setPhotoPreview(getImageUrl(member.photo))
        setIsEditing(true)
        setIsModalOpen(true)
    }

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (name: string, value: string) => {
        if (name === 'hierarchyLevel') {
            setFormData({ ...formData, [name]: parseInt(value) })
        } else {
            setFormData({ ...formData, [name]: value })
        }
    }

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setPhotoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async () => {
        try {
            const data = new FormData()
            data.append('name', formData.name)
            data.append('position', formData.position)
            data.append('description', formData.description)
            data.append('email', formData.email)
            data.append('department', formData.department)
            data.append('hierarchyLevel', formData.hierarchyLevel.toString())
            data.append('facebook', formData.facebook)
            data.append('instagram', formData.instagram)

            if (photoFile) {
                data.append('photo', photoFile)
            }

            if (isEditing && selectedMember) {
                let response = await updateTeamMember(selectedMember.teamId, data)
                response = response.data || response
                const updatedMember: TeamMemberData = {
                    _id: response._id || response.teamId || selectedMember._id,
                    teamId: response.teamId || response._id || selectedMember.teamId,
                    name: response.name || formData.name,
                    position: response.position || formData.position,
                    description: response.description || formData.description,
                    photo: response.photo || selectedMember.photo,
                    email: response.email || formData.email,
                    department: response.department || formData.department,
                    hierarchyLevel: response.hierarchyLevel || formData.hierarchyLevel,
                    socialLinks: {
                        facebook: response.socialLinks?.facebook || formData.facebook,
                        instagram: response.socialLinks?.instagram || formData.instagram
                    },
                    createdAt: response.createdAt || selectedMember.createdAt,
                    updatedAt: response.updatedAt || new Date().toISOString(),
                }
                setTeamMembers(members =>
                    members.map(m => m.teamId === selectedMember.teamId ? updatedMember : m)
                )
                notifySuccess("Team member updated successfully")
            } else {
                let response = await createTeamMember(data)
                console.log("Create team member response:", response)
                response = response.data || response
                const newMember: TeamMemberData = {
                    _id: response._id || response.teamId || `temp-${Date.now()}`,
                    teamId: response.teamId || response._id || `temp-${Date.now()}`,
                    name: response.name || formData.name,
                    position: response.position || formData.position,
                    description: response.description || formData.description,
                    photo: response.photo || null,
                    email: response.email || formData.email,
                    department: response.department || formData.department,
                    hierarchyLevel: response.hierarchyLevel || formData.hierarchyLevel,
                    socialLinks: {
                        facebook: response.socialLinks?.facebook || formData.facebook,
                        instagram: response.socialLinks?.instagram || formData.instagram
                    },
                    createdAt: response.createdAt || new Date().toISOString(),
                    updatedAt: response.updatedAt || new Date().toISOString(),
                }
                setTeamMembers(members => [...members, newMember])
                notifySuccess("Team member created successfully")
            }
            setIsModalOpen(false)
            setPhotoFile(null)
            setPhotoPreview(null)
            setSelectedMember(null)
            setFormData({
                name: "",
                position: "",
                description: "",
                email: "",
                department: "",
                hierarchyLevel: 5,
                facebook: "",
                instagram: ""
            })
        } catch (error: any) {
            console.error("Error in handleSubmit:", error)
            notifyError(isEditing ? "Failed to update team member" : "Failed to create team member")
        }
    }

    const openDeleteDialog = (id: string) => {
        setMemberToDelete(id)
        setIsDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        if (memberToDelete) {
            try {
                await deleteTeamMember(memberToDelete)
                setTeamMembers(members => members.filter(m => m.teamId !== memberToDelete))
                notifySuccess("Team member deleted successfully")
            } catch (error) {
                notifyError("Failed to delete team member")
            } finally {
                setIsDeleteDialogOpen(false)
                setMemberToDelete(null)
            }
        }
    }

    const handleImageError = (teamId: string) => {
        setImageLoadErrors(prev => new Set(prev).add(teamId))
    }

    const PhotoDisplay = ({ member, className = "h-32 w-32" }: { member: TeamMemberData, className?: string }) => {
        const imageUrl = getImageUrl(member.photo)
        const hasError = imageLoadErrors.has(member.teamId)

        if (!imageUrl || hasError) {
            return (
                <div className={`${className} bg-gray-100 rounded-full flex items-center justify-center`}>
                    <User className="h-8 w-8 text-gray-400" />
                </div>
            )
        }

        return (
            <img
                src={imageUrl}
                alt={member.name}
                className={`${className} object-cover rounded-full`}
                onError={() => handleImageError(member.teamId)}
            />
        )
    }

    // Sort team members by hierarchy level
    const sortedTeamMembers = [...teamMembers].sort((a, b) => a.hierarchyLevel - b.hierarchyLevel)

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
                        <h2 className="text-lg font-medium">Team Management</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" onClick={openCreateModal}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Team Member
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
                        {/* Team Members List */}
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <CardTitle>Team Members</CardTitle>
                                <CardDescription>Manage and review team members</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : sortedTeamMembers.length === 0 ? (
                                    <div className="text-center py-12">
                                        <h3 className="text-lg font-medium text-gray-700">No team members found</h3>
                                        <p className="text-gray-500">No team members have been added yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Desktop Table View */}
                                        <div className="hidden md:block overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                                                        <th className="px-4 py-3">Member</th>
                                                        <th className="px-4 py-3">Position</th>
                                                        <th className="px-4 py-3">Department</th>
                                                        <th className="px-4 py-3">Level</th>
                                                        <th className="px-4 py-3">Contact</th>
                                                        <th className="px-4 py-3">Photo</th>
                                                        <th className="px-4 py-3">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {sortedTeamMembers.map((member) => (
                                                        <tr key={member.teamId} className="hover:bg-gray-50">
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <div className="flex items-center">
                                                                    <Avatar className="h-8 w-8 mr-3">
                                                                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                                                            {getInitials(member.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="font-medium text-gray-900">{member.name}</div>
                                                                        <div className="text-xs text-gray-500">ID: {member.teamId.substring(0, 8)}...</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center">
                                                                    <Award className="h-4 w-4 mr-2 text-gray-400" />
                                                                    {member.position}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center">
                                                                    <Building className="h-4 w-4 mr-2 text-gray-400" />
                                                                    {member.department || "Not specified"}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {getHierarchyLabel(member.hierarchyLevel)}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center space-x-2">
                                                                    {member.email && (
                                                                        <a href={`mailto:${member.email}`} className="text-blue-600 hover:text-blue-800">
                                                                            <Mail className="h-4 w-4" />
                                                                        </a>
                                                                    )}
                                                                    {member.socialLinks.facebook && (
                                                                        <a href={member.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                                                            <Facebook className="h-4 w-4" />
                                                                        </a>
                                                                    )}
                                                                    {member.socialLinks.instagram && (
                                                                        <a href={member.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800">
                                                                            <Instagram className="h-4 w-4" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <PhotoDisplay member={member} className="h-12 w-12" />
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="mr-2"
                                                                    onClick={() => openEditModal(member)}
                                                                >
                                                                    <Edit className="h-4 w-4 mr-1" />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    className="bg-red-600 text-white hover:bg-red-700"
                                                                    onClick={() => openDeleteDialog(member.teamId)}
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
                                            {sortedTeamMembers.map((member) => (
                                                <Card key={member.teamId} className="border border-gray-200">
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center">
                                                                <Avatar className="h-12 w-12 mr-3">
                                                                    <AvatarFallback className="bg-blue-100 text-blue-600">
                                                                        {getInitials(member.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <h3 className="font-medium">{member.name}</h3>
                                                                    <p className="text-sm text-gray-500">{member.position}</p>
                                                                    <p className="text-xs text-gray-400">ID: {member.teamId.substring(0, 8)}...</p>
                                                                </div>
                                                            </div>
                                                            <PhotoDisplay member={member} className="h-16 w-16" />
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex items-center">
                                                                <Building className="h-4 w-4 mr-2 text-gray-400" />
                                                                <span className="text-gray-600">Department:</span>
                                                                <span className="ml-2">{member.department || "Not specified"}</span>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Award className="h-4 w-4 mr-2 text-gray-400" />
                                                                <span className="text-gray-600">Level:</span>
                                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {getHierarchyLabel(member.hierarchyLevel)}
                                                                </span>
                                                            </div>
                                                            {member.email && (
                                                                <div className="flex items-center">
                                                                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                                                    <a href={`mailto:${member.email}`} className="text-blue-600 hover:text-blue-800 text-sm">
                                                                        {member.email}
                                                                    </a>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center space-x-4">
                                                                {member.socialLinks.facebook && (
                                                                    <a href={member.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:text-blue-800">
                                                                        <Facebook className="h-4 w-4 mr-1" />
                                                                        <span className="text-sm">Facebook</span>
                                                                    </a>
                                                                )}
                                                                {member.socialLinks.instagram && (
                                                                    <a href={member.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center text-pink-600 hover:text-pink-800">
                                                                        <Instagram className="h-4 w-4 mr-1" />
                                                                        <span className="text-sm">Instagram</span>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 pt-3 border-t flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full"
                                                                onClick={() => openEditModal(member)}
                                                            >
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                className="w-full bg-red-600 text-white hover:bg-red-700"
                                                                onClick={() => openDeleteDialog(member.teamId)}
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
                <DialogContent className="bg-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    placeholder="Enter full name"
                                    className="bg-gray-50 border-gray-300"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="position">Position *</Label>
                                <Input
                                    id="position"
                                    name="position"
                                    value={formData.position}
                                    onChange={handleFormChange}
                                    placeholder="e.g., CEO, Developer"
                                    className="bg-gray-50 border-gray-300"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleFormChange}
                                    placeholder="Enter email address"
                                    className="bg-gray-50 border-gray-300"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="department">Department</Label>
                                <Select value={formData.department} onValueChange={(value) => handleSelectChange('department', value)}>
                                    <SelectTrigger className="bg-gray-50 border-gray-300">
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {DEPARTMENTS.map((dept) => (
                                            <SelectItem key={dept} value={dept} className="bg-gray-50">
                                                {dept}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="hierarchyLevel">Hierarchy Level</Label>
                            <Select value={formData.hierarchyLevel.toString()} onValueChange={(value) => handleSelectChange('hierarchyLevel', value)}>
                                <SelectTrigger className="bg-gray-50 border-gray-300">
                                    <SelectValue placeholder="Select hierarchy level" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {HIERARCHY_LEVELS.map((level) => (
                                        <SelectItem key={level.value} value={level.value.toString()} className="bg-gray-50">
                                            {level.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description/Bio</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleFormChange}
                                placeholder="Enter member bio or description"
                                className="bg-gray-50 border-gray-300"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="photo">Photo (Select a 500px*500px image)</Label>
                            <Input
                                id="photo"
                                name="photo"
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="bg-gray-50 border-gray-300"
                            />
                            {photoPreview && (
                                <div className="mt-2">
                                    <img
                                        src={photoPreview}
                                        alt="Preview"
                                        className="h-20 w-20 object-cover rounded-full border"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label>Social Links</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="facebook">Facebook</Label>
                                    <Input
                                        id="facebook"
                                        name="facebook"
                                        value={formData.facebook}
                                        onChange={handleFormChange}
                                        placeholder="Facebook profile URL"
                                        className="bg-gray-50 border-gray-300"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="instagram">Instagram</Label>
                                    <Input
                                        id="instagram"
                                        name="instagram"
                                        value={formData.instagram}
                                        onChange={handleFormChange}
                                        placeholder="Instagram profile URL"
                                        className="bg-gray-50 border-gray-300"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            disabled={!formData.name || !formData.position}
                        >
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
                        <p className="text-gray-600">Are you sure you want to delete this team member? This action cannot be undone.</p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
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