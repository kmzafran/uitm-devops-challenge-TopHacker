'use client'

import { Globe, ChevronDown } from 'lucide-react'
import { useState } from 'react'

function LanguageSelector() {
    const [isLanguageOpen, setIsLanguageOpen] = useState(false)

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsLanguageOpen(true)}
            onMouseLeave={() => setIsLanguageOpen(false)}
        >
            <button
                className="flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-colors duration-200 p-2 rounded-lg hover:bg-slate-50"
            >
                <Globe size={16} />
                <span>EN</span>
                <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isLanguageOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isLanguageOpen && (
                <div className="absolute right-0 top-full bg-white border border-slate-200 rounded-lg shadow-lg py-2 min-w-[100px] z-50">
                    <button
                        onClick={() => setIsLanguageOpen(false)}
                        className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors duration-200"
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setIsLanguageOpen(false)}
                        className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors duration-200"
                    >
                        MY
                    </button>
                </div>
            )}
        </div>
    )
}

export default LanguageSelector
