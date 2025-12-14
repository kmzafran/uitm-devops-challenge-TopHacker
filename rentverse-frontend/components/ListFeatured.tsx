'use client'

import { useEffect } from 'react'
import CardProperty from '@/components/CardProperty'
import { Swiper, SwiperSlide } from 'swiper/react'
import { FreeMode } from 'swiper/modules'
import usePropertiesStore from '@/stores/propertiesStore'


function ListFeatured() {
  const { properties, isLoading, loadProperties } = usePropertiesStore()

  useEffect(() => {
    // Load featured properties
    loadProperties({ limit: 8, page: 1 })
  }, [loadProperties])

  if (isLoading) {
    return (
      <div className="py-16 px-4 md:px-16">
        <div className="mb-12">
          <h2 className="font-serif text-3xl text-teal-900 mb-4">
            Featured Properties For You
          </h2>
          <p className="text-base text-teal-800 max-w-2xl">
            A selection of verified properties in the most sought-after locations
          </p>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-16 px-4 md:px-16 overflow-hidden">
      {/* Section title */}
      <div className="mb-12">
        <h2 className="font-serif text-3xl text-teal-900 mb-4">
          Featured Properties For You
        </h2>
        <p className="text-base text-teal-800 max-w-2xl">
          A selection of verified properties in the most sought-after locations
        </p>
      </div>

      <Swiper
        modules={[FreeMode]}
        spaceBetween={32}
        freeMode={true}
        grabCursor={true}
        breakpoints={{
          // Mobile
          320: {
            slidesPerView: 1.4,
            spaceBetween: 16,
          },
          // Tablet
          768: {
            slidesPerView: 2.3,
            spaceBetween: 24,
          },
          // Desktop
          1024: {
            slidesPerView: 3,
            spaceBetween: 32,
          },
          // Large desktop
          1280: {
            slidesPerView: 4,
            spaceBetween: 32,
          },
        }}
        className="overflow-hidden"
      >
        {properties.map((property) => (
          <SwiperSlide key={property.id}>
            <CardProperty property={property} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default ListFeatured