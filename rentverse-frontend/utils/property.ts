import type { PropertyType } from '@/types/property'
type SwapCasePropertyType = (property_type: PropertyType) => string
type GetLocaledPriceType = (price: number, locale?: string, currency?: string) => string
type GetLocaledAreaType = (area: number, locale?: string) => string
type GetLocaledRatingType = (rating: number, locale?: string) => string

export const swapCasePropertyType: SwapCasePropertyType = (property_type) => {
  return property_type[0].toUpperCase() + property_type.slice(1)
}

export const getLocaledPrice: GetLocaledPriceType = (price, locale = 'en-US', currency = 'MYR') => {
  return `${
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price)
  }/mo`
}

export const getLocaledArea: GetLocaledAreaType = (area, locale = 'en-US') => {
  return `${
    new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
    }).format(area)
  } sqft`
}

export const getLocaledRating: GetLocaledRatingType = (rating, locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(rating)
}
