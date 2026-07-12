"use client"

import { useState, useEffect } from "react"
import { Home, Mail, Phone, MessageSquare, Calendar, Search, Filter, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AdminSidebar } from "@/components/Sidebar"
import { notifyError, notifySuccess } from "@/components/toast"
import { getContacts, deleteContacts } from "@/services/contactServices"
import formatDate from "@/components/utils/formatDate"

interface ContactMessage {
    _id: string
    contactId: string
    name: string
    number: string | null
    email: string
    message: string
    createdAt: string
    updatedAt: string
    __v: number
}

export default function ContactPage() {
    const [contacts, setContacts] = useState<ContactMessage[]>([])
    const [filteredContacts, setFilteredContacts] = useState<ContactMessage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [contactToDelete, setContactToDelete] = useState<string | null>(null)

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                setIsLoading(true)
                const contactData = await getContacts()
                setContacts(contactData)
                console.log("Fetched contacts:", contactData)
                setFilteredContacts(contactData)
            } catch (error: any) {
                console.error("Failed to fetch contacts:", error)
                if (error.response?.status !== 404) {
                    notifyError(error.response?.data?.message || "Failed to load contact messages")
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchContacts()
    }, [])

    useEffect(() => {
        if (!Array.isArray(contacts)) {
            setFilteredContacts([])
            return
        }

        const filtered = contacts.filter((contact) =>
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.message.toLowerCase().includes(searchTerm.toLowerCase())
        )

        setFilteredContacts(filtered)
    }, [searchTerm, contacts])

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const handleDeleteContact = async () => {
        if (!contactToDelete) return

        try {
            await deleteContacts(contactToDelete)
            setContacts(contacts.filter((contact) => contact.contactId !== contactToDelete))
            setFilteredContacts(filteredContacts.filter((contact) => contact.contactId !== contactToDelete))
            notifySuccess("Contact message deleted successfully")
            setIsDeleteDialogOpen(false)
            setContactToDelete(null)
        } catch (error: any) {
            notifyError(error.response?.data?.message || "Failed to delete contact message")
        }
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Home className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-medium">Contact Messages</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Admin User</span>
                        <Avatar>
                            <AvatarImage src="/placeholder.svg" alt="Admin" />
                            <AvatarFallback>AU</AvatarFallback>
                        </Avatar>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100">
                    <div className="max-w-7xl mx-auto space-y-6">
                        <div className="grid gap-6 md:grid-cols-3">
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>Total Messages</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <MessageSquare className="h-6 w-6 text-blue-500 mr-1" />
                                        {contacts.length}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>This Month</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <Calendar className="h-6 w-6 text-green-500 mr-1" />
                                        {
                                            contacts.filter((contact) => {
                                                const contactDate = new Date(contact.createdAt)
                                                const now = new Date()
                                                return (
                                                    contactDate.getMonth() === now.getMonth() && contactDate.getFullYear() === now.getFullYear()
                                                )
                                            }).length
                                        }
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="border-none shadow-lg">
                                <CardHeader className="pb-2">
                                    <CardDescription>With Phone Numbers</CardDescription>
                                    <CardTitle className="text-3xl font-bold flex items-center">
                                        <Phone className="h-6 w-6 text-purple-500 mr-1" />
                                        {contacts.filter((contact) => contact.number).length}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </div>
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <div>
                                        <CardTitle>Contact Messages</CardTitle>
                                        <CardDescription>Manage and respond to customer inquiries</CardDescription>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <div className="relative flex-1 sm:w-80">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                            <Input
                                                placeholder="Search messages..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <Button variant="outline" size="icon">
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : filteredContacts.length === 0 ? (
                                    <div className="text-center py-12">
                                        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-700">No messages found</h3>
                                        <p className="text-gray-500">
                                            {searchTerm ? "Try adjusting your search terms" : "No contact messages have been received yet"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredContacts.map((contact) => (
                                            <div
                                                key={contact._id}
                                                className="p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start space-x-3 flex-1">
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarFallback className="bg-blue-100 text-blue-600">
                                                                {getInitials(contact.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-medium text-gray-900">{contact.name}</h3>
                                                                <Badge variant="outline" className="text-xs">
                                                                    ID: {contact.contactId.substring(0, 8)}...
                                                                </Badge>
                                                            </div>
                                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-600 mb-2">
                                                                <div className="flex items-center">
                                                                    <Mail className="h-4 w-4 mr-1" />
                                                                    {contact.email}
                                                                </div>
                                                                {contact.number && (
                                                                    <div className="flex items-center">
                                                                        <Phone className="h-4 w-4 mr-1" />
                                                                        {contact.number}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-gray-700 text-sm leading-relaxed">{contact.message}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end text-right ml-4">
                                                        <div className="text-xs text-gray-500 mb-2">{formatDate(contact.createdAt)}</div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                asChild
                                                            >
                                                                <a href={`mailto:${contact.email}?subject=Re: Your Contact Message`}>
                                                                    Reply
                                                                </a>
                                                            </Button>
                                                            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                        onClick={() => setContactToDelete(contact.contactId)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                                        Delete
                                                                    </Button>
                                                                </DialogTrigger>

                                                                {/* Overlay with transparency */}
                                                                <DialogContent
                                                                    className="bg-white text-gray-900 p-6 rounded-lg shadow-xl max-w-md w-full z-50"
                                                                >
                                                                    <DialogHeader className="mb-4">
                                                                        <DialogTitle className="text-lg font-semibold text-gray-800">
                                                                            Delete Contact Message
                                                                        </DialogTitle>
                                                                        <DialogDescription className="text-sm text-gray-600">
                                                                            Are you sure you want to delete this contact message? This action cannot be undone.
                                                                        </DialogDescription>
                                                                    </DialogHeader>

                                                                    <DialogFooter className="mt-6 flex justify-end gap-3">
                                                                        <Button
                                                                            variant="outline"
                                                                            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                                                                            onClick={() => {
                                                                                setIsDeleteDialogOpen(false)
                                                                                setContactToDelete(null)
                                                                            }}
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                        <Button
                                                                            variant="destructive"
                                                                            className="bg-red-500 text-white hover:bg-red-600"
                                                                            onClick={handleDeleteContact}
                                                                        >
                                                                            Delete
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>

                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}