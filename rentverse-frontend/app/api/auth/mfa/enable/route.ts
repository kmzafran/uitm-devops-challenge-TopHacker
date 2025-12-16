import { NextRequest, NextResponse } from 'next/server'
import { forwardRequest, getAuthHeader, createErrorResponse } from '@/utils/apiForwarder'

export async function POST(request: NextRequest) {
  try {
    try {
      // Forward to backend
      const response = await forwardRequest('/api/auth/mfa/enable', {
        method: 'POST',
        headers: {
          ...getAuthHeader(request),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const data = await response.json()
        return NextResponse.json(data, { status: response.status })
      } else {
        // If backend doesn't return JSON, create a generic error response
        return NextResponse.json(
          { success: false, message: 'Invalid response from backend' },
          { status: 502 }
        )
      }
    } catch (backendError) {
      console.error('Backend error during MFA enable:', backendError)
      return NextResponse.json(
        createErrorResponse('Backend service unavailable', backendError as Error, 503),
        { status: 503 }
      )
    }
  } catch (error) {
    console.error('Error during MFA enable:', error)
    return NextResponse.json(
      createErrorResponse('Failed to enable MFA', error as Error),
      { status: 500 },
    )
  }
}