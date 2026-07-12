import { Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border-none shadow-lg text-center">
                <CardHeader className="space-y-4 pb-6">
                    <div className="mx-auto">
                        <div className="text-6xl font-bold text-blue-600">404</div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">Page Not Found</CardTitle>
                    <CardDescription className="text-gray-600">
                        Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the
                        wrong URL.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col space-y-3">
                        <Button asChild className="w-full h-11 bg-blue-600 hover:bg-blue-700">
                            <a href="/login">
                                <Home className="h-4 w-4 mr-2" />
                                Go to Login Page
                            </a>
                        </Button>
                        <Button variant="outline" asChild className="w-full h-11">
                            <a href="/">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Home
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
