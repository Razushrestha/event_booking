import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Props for PaginationControls component
 * @param currentPage - Current active page number
 * @param totalPages - Total number of pages available
 * @param hasNext - Whether there's a next page available
 * @param hasPrev - Whether there's a previous page available
 * @param onPageChange - Callback function when page changes
 * @param totalCount - Total number of items across all pages
 * @param limit - Number of items per page
 */
interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    onPageChange: (page: number) => void;
    totalCount: number;
    limit: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    onPageChange,
    totalCount,
    limit,
}) => {
    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalCount);

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-gray-700">
                Showing {startItem} to {endItem} of {totalCount} results
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={!hasPrev}
                    className="h-8 w-8 p-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                </span>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={!hasNext}
                    className="h-8 w-8 p-0"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default PaginationControls;