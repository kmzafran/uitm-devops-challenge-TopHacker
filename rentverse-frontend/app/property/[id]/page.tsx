'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import ContentWrapper from '@/components/ContentWrapper'
import BarProperty from '@/components/BarProperty'
import ImageGallery from '@/components/ImageGallery'
import BoxPropertyPrice from '@/components/BoxPropertyPrice'
import MapViewer from '@/components/MapViewer'
import { PropertiesApiClient } from '@/utils/propertiesApiClient'
import { ShareService } from '@/utils/shareService'
import type { Property } from '@/types/property'

function DetailPage() {
  const params = useParams()
  const propertyId = params.id as string
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch property data and log view in one call
  useEffect(() => {
    const fetchPropertyAndLogView = async () => {
      if (!propertyId) return
      
      try {
        setIsLoading(true)
        // Use the view logging API which returns complete property data
        const viewResponse = await PropertiesApiClient.logPropertyView(propertyId)
        
        if (viewResponse.success && viewResponse.data.property) {
          setProperty(viewResponse.data.property)
        } else {
          setError('Failed to load property details')
        }
      } catch (err) {
        console.error('Error fetching property:', err)
        setError('Failed to load property details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPropertyAndLogView()
  }, [propertyId])

  // Handle favorite change callback
  const handleFavoriteChange = (isFavorited: boolean, favoriteCount: number) => {
    if (property) {
      setProperty(prev => prev ? {
        ...prev,
        isFavorited,
        favoriteCount
      } : null)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-lg text-slate-600">Loading property details...</div>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // Error state
  if (error || !property) {
    return (
      <ContentWrapper>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-lg text-red-600">{error || 'Property not found'}</div>
          </div>
        </div>
      </ContentWrapper>
    )
  }

  // Fallback images if property doesn't have images
  const tempImage: [string, string, string, string, string] = [
    'https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758016984/rentverse-rooms/Gemini_Generated_Image_5hdui35hdui35hdu_s34nx6.png',
    'https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758211360/rentverse-rooms/Gemini_Generated_Image_ockiwbockiwbocki_vmmlhm.png',
    'https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758211360/rentverse-rooms/Gemini_Generated_Image_5ckgfc5ckgfc5ckg_k9uzft.png',
    'https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758211360/rentverse-rooms/Gemini_Generated_Image_7seyqi7seyqi7sey_jgzhig.png',
    'https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758211362/rentverse-rooms/Gemini_Generated_Image_2wt0y22wt0y22wt0_ocdafo.png',
  ]

  // Use property images or fallback to temp images
  const displayImages = property.images && property.images.length >= 5 
    ? property.images.slice(0, 5) as [string, string, string, string, string]
    : tempImage

  // Format price for display
  const displayPrice = typeof property.price === 'string' ? parseFloat(property.price) : property.price

  // Create share data using ShareService
  const shareData = ShareService.createPropertyShareData({
    title: property.title,
    bedrooms: property.bedrooms,
    city: property.city,
    state: property.state,
    price: property.price
  })

  return (
    <ContentWrapper>
      <BarProperty 
        title={property.title} 
        propertyId={property.id}
        isFavorited={property.isFavorited}
        onFavoriteChange={handleFavoriteChange}
        shareUrl={shareData.url}
        shareText={shareData.text}
      />

      <section className="space-y-6">
        <ImageGallery images={displayImages} />

        {/* Main content area */}
        <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Property details and description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property header */}
            <div className="flex justify-between space-y-4">
              <div>
                <h1 className="text-2xl font-semibold text-teal-600">
                  {property.isAvailable ? 'Available to rent now!' : 'Currently not available'}
                </h1>
                <p className="text-slate-600 text-lg">
                  {property.bedrooms} bedrooms • {property.bathrooms} bathroom • {property.areaSqm} Sqm
                </p>
              </div>

              {/* Stats section */}
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-8">
                  <Image
                    src="https://res.cloudinary.com/dqhuvu22u/image/upload/v1758219434/rentverse-base/icon-star_kwohms.png"
                    width={24}
                    height={24}
                    alt="Star icon"
                    className="w-12 h-12"
                  />
                  <div className="text-center">
                    <div className="text-xl font-semibold text-slate-900">
                      {property.averageRating > 0 ? property.averageRating.toFixed(1) : '4.8'}
                    </div>
                    <div className="text-sm text-slate-500">
                      {property.totalRatings > 0 ? `${property.totalRatings} reviews` : 'Guest reviews'}
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xl font-semibold text-slate-900">
                    {property.viewCount > 1000 ? `${Math.floor(property.viewCount / 1000)}K` : property.viewCount}
                  </div>
                  <div className="text-sm text-slate-500">Viewers</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-slate-600 leading-relaxed">
                {property.description || 'Lorem ipsum dolor sit amet consectetur. Nisl ac mi turpis commodo. Velit tristique lobortis imperdiet aliquam eget. Ultrices diam fringilla sollicitudin dignissim elementum ultrices. Volutpat volutpat in amet ipsum libero. Amet ultrices sit pretium eu enim mi. Sit euismod vel posuere adipiscing nisi auctor. Sit a malesuada arcu morbi amet. Ut nunc mauris dolor sit sagittis eget sed. Nisl porttitor in nascetur maecenas semper massa.'}
              </p>
            </div>
          </div>

          {/* Right side - Booking box */}
          <div className="lg:col-span-1">
            <BoxPropertyPrice 
              price={displayPrice} 
              propertyId={property.id} 
              ownerId={property.ownerId}
            />
          </div>
        </div>
      </section>

      {/* Location section */}
      <section className="mx-auto w-full max-w-6xl space-y-6 py-8">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-3xl text-teal-900">Where you will be</h2>
          <p className="text-lg text-slate-600">
            {property.address}, {property.city}, {property.state}, {property.country === 'MY' ? 'Malaysia' : property.country}
          </p>
        </div>

        {/* MapTiler Map */}
        <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200">
          <MapViewer
            center={{ 
              lng: property.longitude || 102.2386, 
              lat: property.latitude || 6.1254 
            }}
            zoom={14}
            style="streets-v2"
            height="320px"
            width="100%"
            markers={[
              {
                lng: property.longitude || 102.2386,
                lat: property.latitude || 6.1254,
                popup: `<div class="p-2"><h3 class="font-semibold">${property.title}</h3><p class="text-sm text-slate-600">${property.address}, ${property.city}</p></div>`,
                color: '#0d9488',
              },
            ]}
            className="rounded-2xl"
          />
        </div>
      </section>
    </ContentWrapper>
  )
}

export default DetailPage