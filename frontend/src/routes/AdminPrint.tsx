import { useState } from "react"
import { Home, Printer, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AdminSidebar } from "@/components/Sidebar"
import { notifyError, notifySuccess } from "@/components/toast"
import { createThermalPrintJob } from "@/services/thermalPrintServices"

export default function ThermalPrintDashboard() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        mainHeader: "",
        line1: "",
        line2: "",
        line3: "",
        totalPrints: "1"
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true)
            const data = {
                mainHeader: formData.mainHeader,
                line1: formData.line1,
                line2: formData.line2,
                line3: formData.line3,
                totalPrints: formData.totalPrints
            }
            const response = await createThermalPrintJob(data)
            if (response.success) {
                notifySuccess("Thermal print config submitted successfully")
                setIsModalOpen(false)
                setFormData({ mainHeader: "", line1: "", line2: "", line3: "", totalPrints: "1" })
            } else {
                notifyError(response.message || "Failed to submit thermal print config")
            }
        } catch (error) {
            console.error("Error in handleSubmit:", error)
            notifyError("Failed to submit thermal print job")
        } finally {
            setIsSubmitting(false)
        }
    }

    const PreviewPrint = ({ config }: { config: { mainHeader: string, line1: string, line2: string, line3: string, totalPrints: string } }) => {
        const maxLength = 25;
        const truncate = (str: string) => str.length > maxLength ? str.substring(0, maxLength - 3) + "..." : str;
        return (
            <div className="w-60 bg-white border border-gray-300 rounded p-4 mt-2 shadow-sm flex flex-col items-center justify-center h-48">
                <h2 className="text-xl font-bold text-center">{truncate(config.mainHeader) || "Main Header"}</h2>
                {config.line1 && <p className="text-sm text-center">{truncate(config.line1)}</p>}
                {config.line2 && <p className="text-sm text-center">{truncate(config.line2)}</p>}
                {config.line3 && <p className="text-sm text-center">{truncate(config.line3)}</p>}
                <p className="text-xs text-center mt-2 text-gray-500">Print 1 of {config.totalPrints}</p>
            </div>
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
                        <h2 className="text-lg font-medium">Thermal Print Management</h2>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Print Job
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
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <CardTitle>Thermal Print Jobs</CardTitle>
                                <CardDescription>Create and submit thermal print jobs</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12">
                                    <h3 className="text-lg font-medium text-gray-700">Create a new print job</h3>
                                    <p className="text-gray-500">Use the button above to create a new thermal print job.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </main>

                {/* Create Print Job Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="bg-white sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Create Thermal Print Job</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 grid-cols-1 md:grid-cols-2">
                            <div className="grid gap-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="mainHeader">Main Header</Label>
                                    <Input
                                        id="mainHeader"
                                        name="mainHeader"
                                        value={formData.mainHeader}
                                        onChange={handleFormChange}
                                        placeholder="Enter main header (e.g., Event Name)"
                                        className="bg-gray-50 border-gray-300"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="line1">Line 1</Label>
                                    <Input
                                        id="line1"
                                        name="line1"
                                        value={formData.line1}
                                        onChange={handleFormChange}
                                        placeholder="Enter first line (e.g., Date)"
                                        className="bg-gray-50 border-gray-300"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="line2">Line 2</Label>
                                    <Input
                                        id="line2"
                                        name="line2"
                                        value={formData.line2}
                                        onChange={handleFormChange}
                                        placeholder="Enter second line (e.g., Location)"
                                        className="bg-gray-50 border-gray-300"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="line3">Line 3</Label>
                                    <Input
                                        id="line3"
                                        name="line3"
                                        value={formData.line3}
                                        onChange={handleFormChange}
                                        placeholder="Enter third line (e.g., Additional Info)"
                                        className="bg-gray-50 border-gray-300"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="totalPrints">Total Prints</Label>
                                    <Input
                                        id="totalPrints"
                                        name="totalPrints"
                                        type="number"
                                        min="1"
                                        value={formData.totalPrints}
                                        onChange={handleFormChange}
                                        placeholder="Enter number of prints"
                                        className="bg-gray-50 border-gray-300"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Print Preview</Label>
                                <PreviewPrint config={formData} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsModalOpen(false)
                                    setFormData({ mainHeader: "", line1: "", line2: "", line3: "", totalPrints: "1" })
                                }}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                                disabled={isSubmitting}
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                {isSubmitting ? "Submitting..." : "Submit Print Job"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}