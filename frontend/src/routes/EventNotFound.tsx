import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EventNotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
                <p className="text-gray-600 mb-6">
                    Sorry, we couldn't find the event you're looking for. It may have been removed or the link is incorrect.
                </p>
                <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Events
                </Button>
            </div>
        </div>
    );
};

export default EventNotFound;
