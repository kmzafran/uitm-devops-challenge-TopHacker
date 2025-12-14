import { create } from 'zustand'
import type { BookingState, PaymentMethod, PriceDetails } from '@/types/booking'
import type { Property } from '@/types/property'

interface BookingActions {
  // Property actions
  setProperty: (property: Property) => void
  setPropertyId: (propertyId: string) => void
  clearProperty: () => void

  // Date actions
  setCheckInDate: (date: string) => void
  setCheckOutDate: (date: string) => void
  setDuration: (months: number) => void

  // Form actions
  setMessage: (message: string) => void
  setCurrentStep: (step: number) => void
  nextStep: () => void
  previousStep: () => void

  // Payment actions
  setPaymentMethod: (paymentMethod: PaymentMethod) => void

  // Price calculations
  calculatePriceDetails: () => void
  updatePriceDetails: (details: Partial<PriceDetails>) => void

  // General actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  resetBooking: () => void

  // Booking submission
  submitBooking: () => Promise<void>
}

type BookingStore = BookingState & BookingActions

const useBookingStore = create<BookingStore>((set, get) => ({
  // Initial state
  propertyId: null,
  property: null,
  checkInDate: null,
  checkOutDate: null,
  duration: 1,
  message: '',
  currentStep: 1,
  paymentMethod: {
    type: 'visa',
  },
  priceDetails: {
    monthlyPrice: 0,
    months: 1,
    subtotal: 0,
    serviceFee: 0,
    total: 0,
    currency: 'MYR',
  },
  isLoading: false,
  error: null,

  // Property actions
  setProperty: (property: Property) => {
    set({ property })
    get().calculatePriceDetails()
  },

  setPropertyId: (propertyId: string) => {
    set({ propertyId })
  },

  clearProperty: () => {
    set({ property: null, propertyId: null })
  },

  // Date actions
  setCheckInDate: (checkInDate: string) => {
    set({ checkInDate })
    get().calculatePriceDetails()
  },

  setCheckOutDate: (checkOutDate: string) => {
    set({ checkOutDate })
    get().calculatePriceDetails()
  },

  setDuration: (duration: number) => {
    set({ duration })
    get().calculatePriceDetails()
  },

  // Form actions
  setMessage: (message: string) => {
    set({ message })
  },

  setCurrentStep: (currentStep: number) => {
    set({ currentStep })
  },

  nextStep: () => {
    const { currentStep } = get()
    if (currentStep < 3) {
      set({ currentStep: currentStep + 1 })
    }
  },

  previousStep: () => {
    const { currentStep } = get()
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 })
    }
  },

  // Payment actions
  setPaymentMethod: (paymentMethod: PaymentMethod) => {
    set({ paymentMethod })
  },

  // Price calculations
  calculatePriceDetails: () => {
    const { property, duration } = get()
    
    if (!property || !property.price) return

    const monthlyPrice = typeof property.price === 'string' 
      ? parseFloat(property.price) 
      : property.price

    const subtotal = monthlyPrice * duration
    const serviceFee = subtotal * 0.1 // 10% service fee
    const total = subtotal + serviceFee

    set({
      priceDetails: {
        monthlyPrice,
        months: duration,
        subtotal,
        serviceFee,
        total,
        currency: property.currencyCode || 'MYR',
      }
    })
  },

  updatePriceDetails: (details: Partial<PriceDetails>) => {
    set(state => ({
      priceDetails: { ...state.priceDetails, ...details }
    }))
  },

  // General actions
  setLoading: (isLoading: boolean) => {
    set({ isLoading })
  },

  setError: (error: string | null) => {
    set({ error })
  },

  resetBooking: () => {
    set({
      propertyId: null,
      property: null,
      checkInDate: null,
      checkOutDate: null,
      duration: 1,
      message: '',
      currentStep: 1,
      paymentMethod: { type: 'visa' },
      priceDetails: {
        monthlyPrice: 0,
        months: 1,
        subtotal: 0,
        serviceFee: 0,
        total: 0,
        currency: 'MYR',
      },
      isLoading: false,
      error: null,
    })
  },

  // Booking submission
  submitBooking: async () => {
    const { property, message, paymentMethod, priceDetails } = get()
    
    if (!property) {
      set({ error: 'No property selected' })
      return
    }

    set({ isLoading: true, error: null })

    try {
      // Here you would make the API call to submit the booking
      console.log('Submitting booking:', {
        propertyId: property.id,
        message,
        paymentMethod,
        priceDetails,
      })

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // On success, you might redirect or show success message
      console.log('Booking submitted successfully!')
      
    } catch (error) {
      console.error('Booking submission error:', error)
      set({ error: 'Failed to submit booking. Please try again.' })
    } finally {
      set({ isLoading: false })
    }
  },
}))

export default useBookingStore