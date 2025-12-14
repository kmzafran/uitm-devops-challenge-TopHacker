export interface BookingState {
  propertyId: string | null
  property: Property | null
  checkInDate: string | null
  checkOutDate: string | null
  duration: number // in months
  message: string
  currentStep: number
  paymentMethod: PaymentMethod
  priceDetails: PriceDetails
  isLoading: boolean
  error: string | null
}

export interface PaymentMethod {
  type: 'visa' | 'mastercard' | 'paypal'
  cardNumber?: string
  expiryDate?: string
  cvv?: string
}

export interface PriceDetails {
  monthlyPrice: number
  months: number
  subtotal: number
  serviceFee: number
  total: number
  currency: string
}

// Import Property type
import type { Property } from './property'

export interface BookingRequest {
  propertyId: string
  startDate: string
  endDate: string
  rentAmount: number
  securityDeposit: number
  notes: string
}

export interface BookingResponse {
  id: string
  propertyId: string
  startDate: string
  endDate: string
  rentAmount: number
  securityDeposit: number
  notes: string
  status: string
  createdAt: string
  updatedAt: string
}