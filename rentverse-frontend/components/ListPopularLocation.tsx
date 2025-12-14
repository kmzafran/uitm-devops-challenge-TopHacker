'use client'

import CardPopularLocation from '@/components/CardPopularLocation'
import { getPopularLocations } from '@/data/popular-locations'
import { FreeMode } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

function ListPopularLocation() {
  const locations = getPopularLocations()

  return (
    <div className="py-8 px-4 md:px-16 overflow-hidden">
      {/* Section title */}
      <div className="mb-12">
        <h2 className="text-center font-serif text-3xl text-teal-900 mb-4">
          Explore Popular Locations
        </h2>
      </div>
      <Swiper
        modules={[FreeMode]}
        spaceBetween={32}
        freeMode={true}
        grabCursor={true}
        breakpoints={{
          // Mobile
          320: {
            slidesPerView: 2,
            spaceBetween: 16,
          },
          // Tablet
          768: {
            slidesPerView: 3,
            spaceBetween: 24,
          },
          // Desktop
          1024: {
            slidesPerView: 4,
            spaceBetween: 32,
          },
          // Large desktop
          1280: {
            slidesPerView: 6,
            spaceBetween: 32,
          },
        }}
        className="overflow-hidden"
      >
        {locations.map((location) => (
          <SwiperSlide key={location.name}>
            <CardPopularLocation location={location} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default ListPopularLocation