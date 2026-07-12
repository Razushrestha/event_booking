"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { FileText, Upload, X, Check, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { notifyError, notifySuccess } from "@/components/toast"
import { useParams } from "react-router-dom"
import { addProposalByAdmin, deleteProposalByAdmin } from "@/services/proposalServices"
import { getEventById } from "@/services/eventServices"
import { AdminSidebar } from "@/components/Sidebar"
interface Event {
    eventId: string
    proposal?: string | null
}

export function AddProposal() {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isUploaded, setIsUploaded] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [existingProposal, setExistingProposal] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [event, setEvent] = useState<Event | null>(null)
    const params = useParams<{ eventId: string }>()
    // const imageURL = import.meta.env.VITE_IMAGE_URL

    // Fetch event data
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setIsLoading(true)
                if (typeof params.eventId === "string") {
                    const eventData = await getEventById(params.eventId)
                    setEvent(eventData)
                    if (eventData.proposal) {
                        setExistingProposal(eventData.proposal)
                        setIsUploaded(true)
                        setHasChanges(false)
                    }
                } else {
                    throw new Error("Event ID is missing")
                }
            } catch (error) {
                console.error("Failed to fetch event:", error)
                notifyError("Failed to load event details")
            } finally {
                setIsLoading(false)
            }
        }

        fetchEvent()
    }, [params.eventId])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file
        if (file.type !== "application/pdf") {
            notifyError(`${file.name} is not a PDF file`)
            return
        }
        if (file.size > 10 * 1024 * 1024) {
            notifyError(`${file.name} is too large (max 10MB)`)
            return
        }

        setSelectedFile(file)
        setHasChanges(true)
        setIsUploaded(false)
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            notifyError("Please select a PDF file to upload")
            return
        }

        if (!params.eventId) {
            notifyError("Event ID is missing")
            return
        }

        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append("proposal", selectedFile)
            const result = await addProposalByAdmin(params.eventId, formData)

            if (result.success) {
                notifySuccess(`Proposal ${existingProposal ? "updated" : "added"} successfully`)
                setIsUploaded(true)
                setHasChanges(false)
                setExistingProposal(result.proposal)
                setSelectedFile(null)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                }
            } else {
                notifyError(`Failed to ${existingProposal ? "update" : "add"} proposal`)
            }
        } catch (error) {
            notifyError(`Failed to ${existingProposal ? "update" : "add"} proposal. Please try again.`)
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemove = async () => {
        if (!params.eventId) {
            notifyError("Event ID is missing")
            return
        }

        if (!existingProposal) {
            setSelectedFile(null)
            setHasChanges(true)
            setIsUploaded(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
            return
        }

        setIsUploading(true)

        try {
            const result = await deleteProposalByAdmin(params.eventId)
            if (result.success) {
                notifySuccess("Proposal removed successfully")
                setExistingProposal(null)
                setSelectedFile(null)
                setIsUploaded(false)
                setHasChanges(false)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ""
                }
            } else {
                notifyError("Failed to remove proposal")
            }
        } catch (error) {
            notifyError("Failed to remove proposal. Please try again.")
        } finally {
            setIsUploading(false)
        }
    }

    // Extract file name from URL or path
    const getFileName = (url: string | null) => {
        if (!url) return null
        return url.split('/').pop() || "Proposal.pdf"
    }

    // Check if upload button should be shown
    const shouldShowUpload = hasChanges || (selectedFile && !isUploaded)

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-3 w-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading event data...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!event) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-red-600">
                        <p>Event not found</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="md:hidden">
                            <Home className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-medium">Add Event Proposal</h2>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                                    Event Proposal
                                </CardTitle>
                                <CardDescription>
                                    Upload a PDF file containing the event proposal. Only PDF files are supported (Max 10MB).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="application/pdf"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    {!existingProposal && !selectedFile ? (
                                        <div
                                            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <FileText className="h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-700 mb-2">Upload Proposal</h3>
                                            <p className="text-sm text-gray-500 text-center mb-4">
                                                Click to browse or drag and drop your PDF proposal file here
                                            </p>
                                            <Button variant="outline">
                                                <Upload className="h-4 w-4 mr-2" />
                                                Choose File
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="relative p-4 border border-gray-200 rounded-lg bg-white">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <FileText className="h-6 w-6 text-blue-600" />
                                                        <div>
                                                            <p className="font-medium text-gray-700">
                                                                {selectedFile ? selectedFile.name : getFileName(existingProposal)}
                                                            </p>
                                                            {selectedFile && (
                                                                <p className="text-sm text-gray-500">
                                                                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {isUploaded && !hasChanges && (
                                                            <div className="bg-green-500 text-white rounded-full p-1">
                                                                <Check className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={handleRemove}
                                                            className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                            disabled={isUploading}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-center space-x-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploading}
                                                >
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    {existingProposal || selectedFile ? "Replace File" : "Choose File"}
                                                </Button>

                                                {shouldShowUpload && (
                                                    <Button
                                                        onClick={handleUpload}
                                                        disabled={isUploading}
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        {isUploading ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="h-4 w-4 mr-2" />
                                                                {hasChanges ? "Save Changes" : "Upload Proposal"}
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>

                                            {(selectedFile || existingProposal) && (
                                                <div className="text-center text-sm text-gray-600">
                                                    <p className="mb-2 font-medium">
                                                        {selectedFile ? "New file to upload:" : "Current proposal:"}
                                                    </p>
                                                    <p>
                                                        <strong>File:</strong>{" "}
                                                        {selectedFile ? selectedFile.name : getFileName(existingProposal)}
                                                    </p>
                                                    {selectedFile && (
                                                        <p>
                                                            <strong>Size:</strong>{" "}
                                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {hasChanges && (
                                                <div className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded">
                                                    <p>⚠️ You have unsaved changes. Click "Save Changes" to update your proposal.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {isUploaded && !hasChanges && (
                            <Card className="border-green-200 bg-green-50">
                                <CardContent className="p-4">
                                    <div className="flex items-center">
                                        <Check className="h-5 w-5 text-green-600 mr-2" />
                                        <div>
                                            <p className="font-medium text-green-800">Proposal uploaded successfully!</p>
                                            <p className="text-sm text-green-600">The event proposal has been updated.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </main>
            </div>

        </div>
    )
}