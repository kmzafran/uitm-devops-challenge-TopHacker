'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Plus, MoreHorizontal, ImageIcon, X } from 'lucide-react'
import ButtonCircle from '@/components/ButtonCircle'
import { usePropertyListingStore } from '@/stores/propertyListingStore'
import { uploadSingleImageToCloudinary } from '@/utils/uploadService'

interface PhotoItem {
  id: string
  file?: File  // Optional - only for newly uploaded files
  preview?: string  // Optional - for local file previews
  url?: string  // Optional - for already uploaded photos
  isCover: boolean
  isUploading?: boolean  // Optional - for upload progress
}

function AddListingStepTwoManage() {
  const { data, updateData } = usePropertyListingStore()
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [showDropdown, setShowDropdown] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isUpdatingStore = useRef(false) // Track when we're updating the store

  // Load existing photos from store on mount and when external changes occur
  useEffect(() => {
    // Only update from store if we're not currently updating the store
    if (!isUpdatingStore.current && data.images && data.images.length > 0) {
      const existingPhotos: PhotoItem[] = data.images.map((url, index) => ({
        id: `existing-${index}`,
        url: url,
        isCover: index === 0, // First photo is cover by default
      }))
      setPhotos(existingPhotos)
    }
  }, [data.images])

  // Update store whenever photos change (only when user makes changes)
  useEffect(() => {
    const uploadedUrls = photos
      .filter(photo => photo.url && !photo.isUploading)
      .map(photo => photo.url!)
    
    // Only update if we have uploaded URLs and they're different from current store data
    if (uploadedUrls.length > 0) {
      const currentImages = data.images || []
      const hasChanges = uploadedUrls.length !== currentImages.length || 
                        uploadedUrls.some((url, index) => url !== currentImages[index])
      
      if (hasChanges) {
        isUpdatingStore.current = true
        updateData({ images: uploadedUrls })
        // Reset flag after a short delay to allow store update to complete
        setTimeout(() => {
          isUpdatingStore.current = false
        }, 100)
      }
    }
  }, [photos, updateData, data.images])

  // Create array of 5 slots (minimum required)
  const photoSlots = Array.from({ length: 5 }, (_, index) => {
    return photos[index] || null
  })

  const handleAddPhotos = () => {
    setShowUploadModal(true)
  }

  const handleBrowseFiles = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newPhotos: PhotoItem[] = []

    // Create preview items first
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file)
        newPhotos.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          preview,
          isCover: photos.length === 0 && newPhotos.length === 0,
          isUploading: true,
        })
      }
    })

    // Add to photos immediately to show upload progress
    setPhotos(prev => [...prev, ...newPhotos])
    setShowUploadModal(false)

    // Upload each file to Cloudinary
    for (const photoItem of newPhotos) {
      if (photoItem.file) {
        try {
          const result = await uploadSingleImageToCloudinary(photoItem.file)
          
          // Update the photo with the Cloudinary URL
          setPhotos(prev => prev.map(photo => 
            photo.id === photoItem.id 
              ? { ...photo, url: result.secure_url, isUploading: false }
              : photo
          ))
        } catch (error) {
          console.error('Upload failed for photo:', error)
          // Remove failed upload
          setPhotos(prev => prev.filter(photo => photo.id !== photoItem.id))
        }
      }
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (!files) return

    const newPhotos: PhotoItem[] = []

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file)
        newPhotos.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          preview,
          isCover: photos.length === 0 && newPhotos.length === 0,
          isUploading: true,
        })
      }
    })

    if (newPhotos.length > 0) {
      // Add to photos immediately to show upload progress
      setPhotos(prev => [...prev, ...newPhotos])
      setShowUploadModal(false)

      // Upload each file to Cloudinary
      for (const photoItem of newPhotos) {
        if (photoItem.file) {
          try {
            const result = await uploadSingleImageToCloudinary(photoItem.file)
            
            // Update the photo with the Cloudinary URL
            setPhotos(prev => prev.map(photo => 
              photo.id === photoItem.id 
                ? { ...photo, url: result.secure_url, isUploading: false }
                : photo
            ))
          } catch (error) {
            console.error('Upload failed for photo:', error)
            // Remove failed upload
            setPhotos(prev => prev.filter(photo => photo.id !== photoItem.id))
          }
        }
      }
    }
  }

  const handleCloseModal = () => {
    setShowUploadModal(false)
  }

  const handleSetCover = (photoId: string) => {
    setPhotos(prev =>
      prev.map(photo => ({
        ...photo,
        isCover: photo.id === photoId,
      })),
    )
    setShowDropdown(null)
  }

  const handleMoveForward = (photoId: string) => {
    setPhotos(prev => {
      const currentIndex = prev.findIndex(photo => photo.id === photoId)
      if (currentIndex === 0) return prev // Already at front

      const newPhotos = [...prev]
      const [movedPhoto] = newPhotos.splice(currentIndex, 1)
      newPhotos.splice(currentIndex - 1, 0, movedPhoto)
      return newPhotos
    })
    setShowDropdown(null)
  }

  const handleMoveBackward = (photoId: string) => {
    setPhotos(prev => {
      const currentIndex = prev.findIndex(photo => photo.id === photoId)
      if (currentIndex === prev.length - 1) return prev // Already at back

      const newPhotos = [...prev]
      const [movedPhoto] = newPhotos.splice(currentIndex, 1)
      newPhotos.splice(currentIndex + 1, 0, movedPhoto)
      return newPhotos
    })
    setShowDropdown(null)
  }

  const handleDelete = (photoId: string) => {
    setPhotos(prev => {
      const updated = prev.filter(photo => photo.id !== photoId)
      // If deleted photo was cover, make first photo the new cover
      if (updated.length > 0 && !updated.some(photo => photo.isCover)) {
        updated[0].isCover = true
      }
      return updated
    })
    setShowDropdown(null)
  }

  const toggleDropdown = (photoId: string) => {
    setShowDropdown(showDropdown === photoId ? null : photoId)
  }

  // Helper function to get the display source for a photo
  const getPhotoSrc = (photo: PhotoItem): string => {
    return photo.url || photo.preview || ''
  }

  return (
    <>
      <div className="max-w-2xl mx-auto p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Manage your photos
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Upload new photos or manage existing ones
              </p>
            </div>
            <ButtonCircle
              icon={<Plus size={20} />}
              onClick={handleAddPhotos}
            />
          </div>

          {/* Photos Grid */}
          <div className="space-y-4">
            {/* First row - Main photo (larger) */}
            <div className="w-full">
              {photoSlots[0] ? (
                <div className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                  <Image
                    src={getPhotoSrc(photoSlots[0])}
                    alt="Cover photo"
                    fill
                    className="object-cover"
                  />

                  {/* Upload Progress */}
                  {photoSlots[0].isUploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-sm">Uploading...</div>
                    </div>
                  )}

                  {/* Cover Photo Badge */}
                  <div
                    className="absolute top-3 left-3 px-2 py-1 bg-slate-900 bg-opacity-75 text-white text-xs rounded-md">
                    Cover photo
                  </div>

                  {/* Options Menu */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => toggleDropdown(photoSlots[0].id)}
                      className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                    >
                      <MoreHorizontal size={16} className="text-slate-700" />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown === photoSlots[0].id && (
                      <div
                        className="absolute top-10 right-0 bg-white rounded-lg shadow-lg border border-slate-200 py-2 w-36 z-[9999]">
                        <button
                          onClick={() => handleMoveBackward(photoSlots[0].id)}
                          className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Move backward
                        </button>
                        <button
                          onClick={() => handleDelete(photoSlots[0].id)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={handleAddPhotos}
                  className="aspect-[4/3] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <ImageIcon size={32} className="text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500">Add cover photo</span>
                </div>
              )}
            </div>

            {/* Second row - Two photos */}
            <div className="grid grid-cols-2 gap-4">
              {photoSlots.slice(1, 3).map((photo, index) => (
                <div key={index + 1}>
                  {photo ? (
                    <div className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                      <Image
                        src={getPhotoSrc(photo)}
                        alt={`Photo ${index + 2}`}
                        fill
                        className="object-cover"
                      />

                      {/* Upload Progress */}
                      {photo.isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-white text-sm">Uploading...</div>
                        </div>
                      )}

                      {/* Options Menu */}
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => toggleDropdown(photo.id)}
                          className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                        >
                          <MoreHorizontal size={16} className="text-slate-700" />
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown === photo.id && (
                          <div
                            className="absolute top-10 right-0 bg-white rounded-lg shadow-lg border border-slate-200 py-2 w-36 z-[9999]">
                            <button
                              onClick={() => handleSetCover(photo.id)}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Set as cover
                            </button>
                            <button
                              onClick={() => handleMoveForward(photo.id)}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Move forward
                            </button>
                            <button
                              onClick={() => handleMoveBackward(photo.id)}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Move backward
                            </button>
                            <button
                              onClick={() => handleDelete(photo.id)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={handleAddPhotos}
                      className="aspect-[4/3] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      <ImageIcon size={24} className="text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500">Add photo</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Third row - Two photos */}
            <div className="grid grid-cols-2 gap-4">
              {photoSlots.slice(3, 5).map((photo, index) => (
                <div key={index + 3}>
                  {photo ? (
                    <div className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
                      <Image
                        src={getPhotoSrc(photo)}
                        alt={`Photo ${index + 4}`}
                        fill
                        className="object-cover"
                      />

                      {/* Upload Progress */}
                      {photo.isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-white text-sm">Uploading...</div>
                        </div>
                      )}

                      {/* Options Menu */}
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => toggleDropdown(photo.id)}
                          className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all"
                        >
                          <MoreHorizontal size={16} className="text-slate-700" />
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown === photo.id && (
                          <div
                            className="absolute top-10 right-0 bg-white rounded-lg shadow-lg border border-slate-200 py-2 w-36 z-[9999]">
                            <button
                              onClick={() => handleSetCover(photo.id)}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Set as cover
                            </button>
                            <button
                              onClick={() => handleMoveForward(photo.id)}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Move forward
                            </button>
                            <button
                              onClick={() => handleMoveBackward(photo.id)}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Move backward
                            </button>
                            <button
                              onClick={() => handleDelete(photo.id)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={handleAddPhotos}
                      className="aspect-[4/3] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center hover:border-slate-400 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      {index === 1 ? (
                        <>
                          <Plus size={24} className="text-slate-400 mb-1" />
                          <span className="text-xs text-slate-500">Add more</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon size={24} className="text-slate-400 mb-1" />
                          <span className="text-xs text-slate-500">Add photo</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Photos Count */}
          <div className="text-center">
            <p className="text-sm text-slate-600">
              {photos.length} of 5 minimum photos added
            </p>
          </div>
        </div>
      </div>

      {/* Upload Photos Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
          <div className="absolute inset-0 bg-black opacity-50" onClick={handleCloseModal}></div>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full z-10">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Upload Photos
            </h3>

            {/* Drag and Drop Area */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 rounded-lg p-4 mb-4 transition-all flex flex-col items-center justify-center
              ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-dashed border-slate-300 bg-slate-50'}
              `}
            >
              <p className="text-sm text-slate-500 text-center mb-2">
                Drag and drop your photos here, or
              </p>
              <button
                onClick={handleBrowseFiles}
                className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors duration-200 mb-2"
              >
                <Plus size={20} />
                <span>Browse files</span>
              </button>
              <p className="text-xs text-slate-400 text-center">
                (JPG, PNG, GIF up to 10MB)
              </p>
            </div>

            {/* Selected Photos Preview */}
            {photos.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-900 mb-2">
                  Selected Photos
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group">
                      <Image
                        src={getPhotoSrc(photo)}
                        alt="Selected photo"
                        width={100}
                        height={100}
                        className="object-cover rounded-md"
                      />

                      {/* Upload Progress */}
                      {photo.isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                          <div className="text-white text-xs">Uploading...</div>
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={() => handleDelete(photo.id)}
                        className="absolute top-1 right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-all"
                        title="Remove photo"
                        disabled={photo.isUploading}
                      >
                        <X size={16} className="text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm bg-slate-100 rounded-md hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AddListingStepTwoManage
