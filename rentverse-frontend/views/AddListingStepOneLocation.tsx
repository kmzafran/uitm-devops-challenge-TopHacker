'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { ChevronDown } from 'lucide-react'
import * as maptilersdk from '@maptiler/sdk'
import { getAllStates, getDistrictsByState, getLocationsByDistrict } from '@/data/locations'
import { LocationCoordinates } from '@/types/location'
import { usePropertyListingStore } from '@/stores/propertyListingStore'

function AddListingStepOneLocation() {
  // Store integration
  const { data, updateData, markStepCompleted, nextStep } = usePropertyListingStore()
  
  // Local state for form inputs, initialized from store data
  const [selectedState, setSelectedState] = useState(data.state || '')
  const [selectedDistrict, setSelectedDistrict] = useState(data.district || '')
  const [selectedSubdistrict, setSelectedSubdistrict] = useState(data.subdistrict || '')
  const [streetAddress, setStreetAddress] = useState(data.streetAddress || '')
  const [houseNumber, setHouseNumber] = useState(data.houseNumber || '')

  // Dropdown states
  const [showStateDropdown, setShowStateDropdown] = useState(false)
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)
  const [showSubdistrictDropdown, setShowSubdistrictDropdown] = useState(false)

  // Map states
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maptilersdk.Map | null>(null)
  const marker = useRef<maptilersdk.Marker | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([100.3327, 5.4164]) // Default to Penang

  // Data
  const states = getAllStates()
  const districts = selectedState ? getDistrictsByState(selectedState) : []
  const subdistricts = useMemo(() => 
    selectedState && selectedDistrict ? getLocationsByDistrict(selectedState, selectedDistrict) : [],
    [selectedState, selectedDistrict]
  )

  // Auto-fill effect when coordinates are available from previous step
  useEffect(() => {
    if (data.latitude && data.longitude && data.state && data.district) {
      // Check if the auto-filled state exists in our database
      const availableStates = getAllStates()
      if (availableStates.includes(data.state)) {
        setSelectedState(data.state)
        
        // Check if the auto-filled district exists for this state
        const availableDistricts = getDistrictsByState(data.state)
        if (availableDistricts.includes(data.district)) {
          setSelectedDistrict(data.district)
          
          // Check if the auto-filled subdistrict exists for this district
          const availableSubdistricts = getLocationsByDistrict(data.state, data.district)
          const subdistrictMatch = availableSubdistricts.find(loc => loc.name === data.subdistrict)
          if (subdistrictMatch) {
            setSelectedSubdistrict(data.subdistrict)
          }
        }
        
        // Always set street address if available
        if (data.streetAddress) {
          setStreetAddress(data.streetAddress)
        }
      }
    }
  }, [data.latitude, data.longitude, data.state, data.district, data.subdistrict, data.streetAddress])

  // Update store when form values change
  useEffect(() => {
    const updateObject = {
      state: selectedState,
      district: selectedDistrict,
      subdistrict: selectedSubdistrict,
      streetAddress,
      houseNumber,
    }
    
    console.log('Updating store with location data:', updateObject)
    updateData(updateObject)
  }, [selectedState, selectedDistrict, selectedSubdistrict, streetAddress, houseNumber, updateData])

  // Initialize MapTiler API key
  useEffect(() => {
    if (!maptilersdk.config.apiKey) {
      maptilersdk.config.apiKey = process.env.NEXT_PUBLIC_MAPTILER_API || ''
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maptilersdk.Map({
      container: mapContainer.current,
      style: 'streets-v2',
      center: mapCenter,
      zoom: 13,
      interactive: true,
    })

    // Add draggable marker with better configuration
    marker.current = new maptilersdk.Marker({
      color: '#EF4444',
      draggable: true,
      pitchAlignment: 'map',
      rotationAlignment: 'map',
    })
      .setLngLat(mapCenter)
      .addTo(map.current)

    // Handle marker drag events for better responsiveness
    marker.current.on('dragstart', () => {
      // Change cursor to indicate dragging
      if (map.current) {
        map.current.getCanvas().style.cursor = 'grabbing'
      }
    })

    marker.current.on('drag', () => {
      // Update coordinates in real-time during drag
      if (marker.current) {
        const lngLat = marker.current.getLngLat()
        setMapCenter([lngLat.lng, lngLat.lat])
      }
    })

    marker.current.on('dragend', () => {
      // Reset cursor and final coordinate update
      if (map.current) {
        map.current.getCanvas().style.cursor = 'grab'
      }
      if (marker.current) {
        const lngLat = marker.current.getLngLat()
        setMapCenter([lngLat.lng, lngLat.lat])
      }
    })

    // Also allow clicking on map to move marker
    map.current.on('click', (e) => {
      if (marker.current) {
        marker.current.setLngLat(e.lngLat)
        setMapCenter([e.lngLat.lng, e.lngLat.lat])
      }
    })

    // Set initial cursor style
    map.current.on('load', () => {
      if (map.current) {
        map.current.getCanvas().style.cursor = 'grab'
      }
    })

    return () => {
      if (marker.current) {
        marker.current.remove()
      }
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [mapCenter])

  // Update map center when location changes
  useEffect(() => {
    if (map.current && selectedSubdistrict) {
      const subdistrictData = subdistricts.find(s => s.name === selectedSubdistrict)
      if (subdistrictData) {
        const newCenter: [number, number] = [subdistrictData.longitude, subdistrictData.latitude]
        setMapCenter(newCenter)

        map.current.flyTo({
          center: newCenter,
          zoom: 15,
          duration: 1000,
        })

        if (marker.current) {
          marker.current.setLngLat(newCenter)
        }
      }
    }
  }, [selectedSubdistrict, subdistricts])

  const handleStateSelect = (state: string) => {
    setSelectedState(state)
    setSelectedDistrict('')
    setSelectedSubdistrict('')
    setShowStateDropdown(false)
  }

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district)
    setSelectedSubdistrict('')
    setShowDistrictDropdown(false)
  }

  const handleSubdistrictSelect = (subdistrict: LocationCoordinates) => {
    setSelectedSubdistrict(subdistrict.name)
    setShowSubdistrictDropdown(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <h2 className="text-3xl font-serif text-slate-900">
              Confirm your address
            </h2>
            <p className="text-lg text-slate-600">
              Your address is only shared with guests after they&apos;ve made a reservation.
            </p>
          </div>

          {/* Location Selection */}
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="block text-lg font-medium text-slate-900">
                Where is your house located?
              </label>

              {/* Grouped Location Dropdowns */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl relative">
                {/* State Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowStateDropdown(!showStateDropdown)}
                    className="w-full px-4 py-4 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors flex items-center justify-between rounded-t-2xl"
                  >
                    <span className={selectedState ? 'text-slate-900' : 'text-slate-500'}>
                      {selectedState ? selectedState.replace('-', ' ') : 'Penang'}
                    </span>
                    <ChevronDown size={20} className="text-slate-400" />
                  </button>

                  {showStateDropdown && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] max-h-60 overflow-y-auto">
                      {states.map((state, index) => (
                        <button
                          key={index}
                          onClick={() => handleStateSelect(state)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 capitalize"
                        >
                          {state.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-200"></div>

                {/* District Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => selectedState && setShowDistrictDropdown(!showDistrictDropdown)}
                    disabled={!selectedState}
                    className="w-full px-4 py-4 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors flex items-center justify-between disabled:bg-white disabled:cursor-not-allowed"
                  >
                    <span className={selectedDistrict ? 'text-slate-900' : 'text-slate-500'}>
                      {selectedDistrict ? selectedDistrict.replace('-', ' ') : 'Select location'}
                    </span>
                    <ChevronDown size={20} className="text-slate-400" />
                  </button>

                  {showDistrictDropdown && selectedState && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] max-h-60 overflow-y-auto">
                      {districts.map((district, index) => (
                        <button
                          key={index}
                          onClick={() => handleDistrictSelect(district)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 capitalize"
                        >
                          {district.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-200"></div>

                {/* Subdistrict Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => selectedDistrict && setShowSubdistrictDropdown(!showSubdistrictDropdown)}
                    disabled={!selectedDistrict}
                    className="w-full px-4 py-4 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors flex items-center justify-between disabled:bg-white disabled:cursor-not-allowed rounded-b-2xl"
                  >
                    <span className={selectedSubdistrict ? 'text-slate-900' : 'text-slate-500'}>
                      {selectedSubdistrict ? selectedSubdistrict.replace('-', ' ') : 'Select subdistrict'}
                    </span>
                    <ChevronDown size={20} className="text-slate-400" />
                  </button>

                  {showSubdistrictDropdown && selectedDistrict && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[9999] max-h-60 overflow-y-auto">
                      {subdistricts.map((subdistrict, index) => (
                        <button
                          key={index}
                          onClick={() => handleSubdistrictSelect(subdistrict)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 capitalize"
                        >
                          {subdistrict.name.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Street Address */}
            <div className="space-y-3">
              <label className="block text-lg font-medium text-slate-900">
                Street address (optional)
              </label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="House name/number + street/road"
                className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-slate-400 focus:outline-none transition-colors"
              />
            </div>

            {/* House Number */}
            <div className="space-y-3">
              <label className="block text-lg font-medium text-slate-900">
                What is the house number in blue or yellow book? <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="e.g. 77/139"
                className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-slate-400 focus:outline-none transition-colors"
              />
              <p className="text-sm text-slate-500">
                House number or unit number shows in blue, yellow book or official property documentation.
              </p>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-slate-200" />

          {/* Map Section */}
          <div className="space-y-6">
            {/* Map Header */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
              <Image
                src="https://res.cloudinary.com/dqhuvu22u/image/upload/f_webp/v1758297955/rentverse-base/image_13_uzxdvr.png"
                width={40}
                height={40}
                alt="Location icon"
                className="w-10 h-10 flex-shrink-0"
              />
              <div className="space-y-1">
                <h4 className="font-medium text-slate-900">Precise location required</h4>
                <p className="text-sm text-slate-600">
                  Please drag the marker to the exact location of your unit for accurate property positioning.
                </p>
              </div>
            </div>

            {/* Map Container */}
            <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200">
              <div
                ref={mapContainer}
                className="map w-full h-full"
                style={{ height: '100%', width: '100%' }}
              />
            </div>

            {/* Coordinates Display */}
            <div className="text-center text-sm text-slate-500">
              Current position: {mapCenter[1].toFixed(6)}, {mapCenter[0].toFixed(6)}
            </div>
          </div>

          {/* Auto-fill Status */}
          {data.latitude && data.longitude && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-green-700">
                ✓ Address auto-filled from map coordinates
              </p>
              <p className="text-sm text-green-600 mt-1">
                {selectedState && `State: ${selectedState}`}
                {selectedState && selectedDistrict && ` • District: ${selectedDistrict}`}
                {selectedState && selectedDistrict && selectedSubdistrict && ` • Subdistrict: ${selectedSubdistrict}`}
              </p>
              {data.autoFillDistance && (
                <p className="text-sm text-green-600 mt-1">
                  📍 Distance to closest match: {data.autoFillDistance.toFixed(2)}km
                </p>
              )}
              <p className="text-sm text-green-600 mt-1">
                You can modify the details above if needed
              </p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-center pt-6">
            <button
              onClick={() => {
                console.log('Location details button clicked:', {
                  selectedState,
                  selectedDistrict,
                  selectedSubdistrict,
                  canProceed: selectedState && selectedDistrict
                })
                
                // Mark step as completed if required fields are filled
                if (selectedState && selectedDistrict) {
                  markStepCompleted(4) // Step 4 is location-details step
                  nextStep()
                } else {
                  console.warn('Cannot proceed: missing required fields')
                }
              }}
              disabled={!selectedState || !selectedDistrict}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                selectedState && selectedDistrict
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {selectedState && selectedDistrict ? 'Continue' : 'Please select state and district'}
            </button>
          </div>
        </div>
      </div>
  )
}

export default AddListingStepOneLocation