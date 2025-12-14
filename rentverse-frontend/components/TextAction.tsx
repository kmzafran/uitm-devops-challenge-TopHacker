import Link from 'next/link'

function TextAction({ href, text }: { href?: string; text: string }) {
  return (
    <Link
      href={href || '#'}
      className="text-slate-700 hover:text-slate-900 transition-colors duration-200 relative group"
    >
      {text}
      <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-teal-500 transition-all duration-300 group-hover:w-full"></span>
    </Link>
  )
}

export default TextAction