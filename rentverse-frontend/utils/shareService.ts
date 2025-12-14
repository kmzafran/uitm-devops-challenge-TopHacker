/**
 * Share Service - Handles property sharing functionality
 * with Navigator Share API and fallbacks
 */

export interface ShareData {
  title: string
  text: string
  url: string
}

export interface ShareOptions {
  showToast?: boolean
  fallbackMessage?: string
}

export class ShareService {
  /**
   * Share content using Navigator Share API with fallbacks
   * @param shareData - The data to share (title, text, url)
   * @param options - Additional options for sharing behavior
   */
  static async share(shareData: ShareData, options: ShareOptions = {}): Promise<boolean> {
    const { showToast = true, fallbackMessage = 'Link copied to clipboard!' } = options

    try {
      // Check if the Navigator Share API is supported
      if (navigator.share && this.canShare(shareData)) {
        await navigator.share(shareData)
        console.log('Content shared successfully via Navigator Share API')
        return true
      } else {
        // Fallback to clipboard
        await this.copyToClipboard(shareData.url, showToast, fallbackMessage)
        return true
      }
    } catch (error) {
      console.error('Error sharing content:', error)
      
      // If Navigator Share fails, try clipboard as fallback
      try {
        await this.copyToClipboard(shareData.url, showToast, fallbackMessage)
        return true
      } catch (clipboardError) {
        console.error('Clipboard fallback also failed:', clipboardError)
        
        // Ultimate fallback - show prompt with URL
        this.showUrlPrompt(shareData.url)
        return false
      }
    }
  }

  /**
   * Check if content can be shared via Navigator Share API
   */
  private static canShare(shareData: ShareData): boolean {
    if (!navigator.canShare) {
      return true // Assume it can share if canShare is not available
    }
    return navigator.canShare(shareData)
  }

  /**
   * Copy URL to clipboard
   */
  private static async copyToClipboard(url: string, showToast: boolean, message: string): Promise<void> {
    if (!navigator.clipboard) {
      throw new Error('Clipboard API not supported')
    }
    
    await navigator.clipboard.writeText(url)
    console.log('URL copied to clipboard')
    
    if (showToast) {
      // For now, use alert. In a real app, you'd use a toast notification system
      alert(message)
    }
  }

  /**
   * Show URL in a prompt as ultimate fallback
   */
  private static showUrlPrompt(url: string): void {
    const userResponse = prompt('Copy this link:', url)
    if (userResponse !== null) {
      console.log('User manually copied the URL')
    }
  }

  /**
   * Create share data for a property
   */
  static createPropertyShareData(property: {
    title: string
    bedrooms: number
    city: string
    state: string
    price: string | number
  }, url?: string): ShareData {
    const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
    const price = typeof property.price === 'string' ? parseFloat(property.price) : property.price
    
    return {
      title: `${property.title} - Property for Rent`,
      text: `Check out this amazing ${property.bedrooms}-bedroom property: ${property.title}. $${price}/month in ${property.city}, ${property.state}. Find your perfect rental on Rentverse!`,
      url: currentUrl
    }
  }

  /**
   * Check if sharing is supported in the current environment
   */
  static isShareSupported(): boolean {
    return typeof navigator !== 'undefined' && 
           (!!navigator.share || !!navigator.clipboard)
  }

  /**
   * Get the preferred sharing method description
   */
  static getShareMethodDescription(): string {
    if (typeof navigator === 'undefined') {
      return 'Sharing not available'
    }
    
    if ('share' in navigator && typeof navigator.share === 'function') {
      return 'Native share dialog'
    } else if ('clipboard' in navigator && navigator.clipboard) {
      return 'Copy to clipboard'
    } else {
      return 'Manual copy'
    }
  }
}

export default ShareService