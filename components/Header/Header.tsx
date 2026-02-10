import Link from 'next/link'
import { useRouter } from 'next/router'
import { FiHome, FiFilm, FiTv, FiSearch } from 'react-icons/fi'

export default function Header() {
  const router = useRouter()

  const navItems = [
    { href: '/', label: 'Головна', icon: FiHome },
    { href: '/movies', label: 'Фільми', icon: FiFilm },
    { href: '/series', label: 'Серіали', icon: FiTv },
  ]

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">MovieHub</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = router.pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                    isActive
                      ? 'text-primary font-semibold'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Icon />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              href="/search"
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <FiSearch size={20} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
