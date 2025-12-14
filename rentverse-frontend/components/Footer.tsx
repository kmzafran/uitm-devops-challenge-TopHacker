import { Globe } from 'lucide-react'
import { FaXTwitter } from 'react-icons/fa6'
import { FaInstagram, FaFacebook } from 'react-icons/fa'
import FooterWrapper from '@/components/FooterWrapper'

function Footer() {
  return (
    <FooterWrapper>
      <footer className="w-full bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Main footer content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* RentVerse Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                RentVerse
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            {/* Explore Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Explore
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">
                    All Properties
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">
                    Popular Locations
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Section */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Support
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">
                    Help Center (FAQ)
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">
                    Terms & Conditions
                  </a>
                </li>
                <li>
                  <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors duration-200">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom section */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200">
            {/* Copyright */}
            <div className="mb-4 md:mb-0">
            <span className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Metaairflow Sdn. Bhd. All rights reserved.
            </span>
            </div>

            {/* Language, Currency & Social */}
            <div className="flex items-center space-x-6">
              {/* Language Selector */}
              <div
                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors duration-200 cursor-pointer">
                <Globe size={16} />
                <span className="text-sm font-medium">English (US)</span>
              </div>

              {/* Currency */}
              <div
                className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 transition-colors duration-200 cursor-pointer">
                <span className="text-sm font-medium">RM</span>
                <span className="text-sm">MYR</span>
              </div>

              {/* Social Media Icons */}
              <div className="flex items-center space-x-4">
                <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors duration-200">
                  <FaFacebook size={20} />
                </a>
                <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors duration-200">
                  <FaXTwitter size={20} />
                </a>
                <a href="#" className="text-slate-400 hover:text-slate-600 transition-colors duration-200">
                  <FaInstagram size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </FooterWrapper>
  )
}

export default Footer
