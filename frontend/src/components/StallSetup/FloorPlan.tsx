"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { ImageIcon, Upload, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { notifyError, notifySuccess } from "@/components/toast"
import { uploadFloorPlans } from "@/services/stallSetupServices"
import { useDropzone } from "react-dropzone"

interface UploadFloorPlansData {
  newFiles: File[]
  existingUrls: string[]
  replaceAll: boolean
}

interface FloorPlanUploadProps {
  eventId: string
  floorPlan?: string[] | null
}

const acceptedFileTypes = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
}

export function FloorPlanUpload({ eventId, floorPlan }: FloorPlanUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isUploaded, setIsUploaded] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const imageURL = import.meta.env.VITE_IMAGE_URL

  useEffect(() => {
    if (floorPlan && floorPlan.length > 0) {
      setPreviewUrls([...floorPlan])
      setExistingImageUrls([...floorPlan])
      setIsUploaded(true)
      setHasChanges(false)
    }
  }, [floorPlan])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Validate each file
    const validFiles = acceptedFiles.filter((file) => {
      if (!Object.keys(acceptedFileTypes).includes(file.type)) {
        notifyError(`${file.name} is not a valid image file (JPG, PNG, GIF only)`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        notifyError(`${file.name} is too large (max 10MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setSelectedFiles((prev) => [...prev, ...validFiles])
    setHasChanges(true)
    setIsUploaded(false)

    // Create preview URLs for new files
    const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file))
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls])

    console.log("Added files:", validFiles.map(f => f.name), "New previewUrls:", newPreviewUrls)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: acceptedFileTypes,
    multiple: true,
    onDrop,
    disabled: isUploading,
  })

  const handleUpload = async () => {
    if (previewUrls.length === 0) {
      notifyError("Please select at least one floor plan image")
      return
    }

    setIsUploading(true)

    try {
      const uploadData: UploadFloorPlansData = {
        newFiles: selectedFiles,
        existingUrls: existingImageUrls,
        replaceAll: true,
      }

      console.log("Uploading floor plans:", {
        newFiles: selectedFiles.map(f => f.name),
        existingUrls: existingImageUrls,
      })

      const result = await uploadFloorPlans(eventId, uploadData)

      notifySuccess("Floor plans updated successfully")
      setIsUploaded(true)
      setHasChanges(false)
      setSelectedFiles([])

      if (result && result.floorPlans) {
        setExistingImageUrls([...result.floorPlans])
        setPreviewUrls([...result.floorPlans])
      }
    } catch (error) {
      console.error("Upload error:", error)
      notifyError("Failed to update floor plans. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()

    console.log("Removing image at index:", index, "URL:", previewUrls[index])

    const removedUrl = previewUrls[index]
    const isNewFile = removedUrl.startsWith("blob:")
    let newSelectedFiles = [...selectedFiles]

    if (isNewFile) {
      // For new files, calculate the index in selectedFiles based on the position after existingImageUrls
      const existingCount = existingImageUrls.length
      const fileIndex = index - existingCount
      if (fileIndex >= 0 && fileIndex < selectedFiles.length) {
        newSelectedFiles = selectedFiles.filter((_, i) => i !== fileIndex)
        URL.revokeObjectURL(removedUrl)
      }
    } else {
      // For existing server images
      setExistingImageUrls((prev) => prev.filter((url) => url !== removedUrl))
    }

    // Update previewUrls
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index)
    setPreviewUrls(newPreviewUrls)
    setSelectedFiles(newSelectedFiles)
    setHasChanges(true)
    setIsUploaded(false)

    console.log("After remove:", {
      selectedFiles: newSelectedFiles.map(f => f.name),
      previewUrls: newPreviewUrls,
      existingImageUrls,
    })
  }

  const handleRemoveAll = () => {
    previewUrls.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url)
      }
    })

    setSelectedFiles([])
    setPreviewUrls([])
    setExistingImageUrls([])
    setIsUploaded(false)
    setHasChanges(true)
  }

  const getImageSrc = (url: string) => {
    if (!url) return "/placeholder.svg"
    if (url.startsWith("http") || url.startsWith("blob:")) return url
    return `${imageURL}${url}`
  }

  const shouldShowUploadButton = hasChanges || (selectedFiles.length > 0 && !isUploaded)

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [previewUrls])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ImageIcon className="h-5 w-5 mr-2 text-blue-600" />
            Event Floor Plan
          </CardTitle>
          <CardDescription>
            Upload floor plan images to help visualize stall locations and layout. Supported formats: JPG, PNG, GIF (Max
            10MB)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 transition-colors cursor-pointer
                ${isDragActive ? "bg-gray-100 border-blue-500" : "hover:bg-gray-100"}
                ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input {...getInputProps()} />
              {previewUrls.length === 0 ? (
                <>
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Upload Floor Plan</h3>
                  <p className="text-sm text-gray-500 text-center mb-4">
                    Click to browse or drag and drop your floor plan images here
                  </p>
                  <Button variant="outline" disabled={isUploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                </>
              ) : (
                <div className="w-full space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {previewUrls.map((url, index) => (
                      <div
                        key={index}
                        className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-gray-200"
                      >
                        <img
                          src={getImageSrc(url) || "/placeholder.svg"}
                          alt={`Floor plan preview ${index + 1}`}
                          className="object-contain w-full h-full bg-white"
                        />
                        {isUploaded && !hasChanges && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        <button
                          onClick={(e) => handleRemove(index, e)}
                          className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          disabled={isUploading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {previewUrls.length > 0 && (
              <>
                <div className="flex justify-center mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                    <ImageIcon className="h-4 w-4 mr-1 text-blue-500" />
                    Recommended Floor Size: <span className="ml-1 font-bold">1200x800 </span> pixels
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-semibold border border-yellow-200 shadow-sm ml-2">
                    Max file size: <span className="ml-1 font-bold">2MB</span> (for best performance)
                  </span>
                </div>

                <div className="flex justify-center space-x-3">

                  <Button variant="outline" onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement | null)?.click()} disabled={isUploading}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add More Images
                  </Button>

                  {shouldShowUploadButton && (
                    <Button onClick={handleUpload} disabled={isUploading} className="bg-blue-600 hover:bg-blue-700">
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {hasChanges ? "Save Changes" : "Upload Floor Plans"}
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleRemoveAll}
                    disabled={isUploading}
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove All
                  </Button>
                </div>
              </>
            )}

            {selectedFiles.length > 0 && (
              <div className="text-center text-sm text-gray-600">
                <p className="mb-2 font-medium">New files to upload:</p>
                {selectedFiles.map((file, index) => (
                  <div key={index}>
                    <p>
                      <strong>File {index + 1}:</strong> {file.name}
                    </p>
                    <p>
                      <strong>Size:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ))}
              </div>
            )}

            {hasChanges && (
              <div className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded">
                <p>⚠️ You have unsaved changes. Click "Save Changes" to update your floor plans.</p>
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
                <p className="font-medium text-green-800">Floor plan updated successfully!</p>
                <p className="text-sm text-green-600">You can now proceed to set up stall types.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}