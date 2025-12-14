import Image from 'next/image'
import ContentWrapper from '@/components/ContentWrapper'
import SearchBoxProperty from '@/components/SearchBoxProperty'
import ListFeatured from '@/components/ListFeatured'
import ListPopularLocation from '@/components/ListPopularLocation'

export default function Home() {
  return (
    <div>
      <ContentWrapper>
        {/* Hero Section */}
        <section className="relative min-h-[600px] flex justify-center">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            {/* Desktop Hero Image */}
            <Image
              width={1440}
              height={600}
              alt="Hero Background"
              className="w-full h-auto bg-top hidden md:block"
              src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758183708/rentverse-base/hero_bg_desktop_z8j6pg.png" />
            {/* Mobile Hero Image */}
            <Image
              width={320}
              height={600}
              alt="Hero Background"
              className="w-full h-full object-cover md:hidden"
              src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758183708/rentverse-base/hero_bg_mobile_s4xpxr.png" />
          </div>

          {/* Content Overlay */}
          <div className="relative z-10 text-center max-w-4xl mx-auto px-4 mt-10">
            <h1
              className="mx-auto font-serif text-4xl md:text-5xl lg:text-6xl text-teal-900 mb-4 max-w-2xl leading-tight">
              The right home is waiting for you
            </h1>
            <p className="text-lg md:text-xl text-teal-700 mb-8 mx-auto max-w-lg">
              Explore thousands of apartments, condominiums, and houses for rent across the country.
            </p>
            <SearchBoxProperty />
            <Image
              src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758186240/rentverse-base/sample-dashboard_h7ez5z.png"
              alt="Search Results Sample on Rentverse"
              width={1080}
              height={720}
              className="my-20 rounded-lg shadow-lg z-10"
            />
          </div>
        </section>
        {/* Trusted Section */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-serif text-slate-800 text-center mb-12">
              Trusted by Thousands of Tenants and Property Owners
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              <div className="flex items-center text-start gap-x-4">
                <Image
                  src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758187013/rentverse-base/icon-key-property_nkanqy.png"
                  width={48}
                  height={48}
                  alt="Property Owners Icon"
                  className="w-12 h-12"
                />
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">10,000+</span>
                  <p className="text-sm md:text-base text-slate-600">Listed properties</p>
                </div>
              </div>

              <div className="flex items-center text-start gap-x-4">
                <Image
                  src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758187014/rentverse-base/icon-location_yzbsol.png"
                  width={48}
                  height={48}
                  alt="Location Icon"
                  className="w-12 h-12"
                />
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">200+</span>
                  <p className="text-sm md:text-base text-slate-600">Strategic locations</p>
                </div>
              </div>

              <div className="flex items-center text-start gap-x-4">
                <Image
                  src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758187014/rentverse-base/icon-rating_nazm4g.png"
                  width={48}
                  height={48}
                  alt="Rating Icon"
                  className="w-12 h-12"
                />
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">98%</span>
                  <p className="text-sm md:text-base text-slate-600">User satisfaction rate</p>
                </div>
              </div>
              <div className="flex items-center text-start gap-x-4">
                <Image
                  src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758187014/rentverse-base/icon-check_poswwx.png"
                  width={48}
                  height={48}
                  alt="Badge Icon"
                  className="w-12 h-12"
                />
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-bold text-slate-800 mb-1">5,000+</span>
                  <p className="text-sm md:text-base text-slate-600">Verified users</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <ListFeatured />
        <ListPopularLocation />
      </ContentWrapper>
    </div>
  )
}
