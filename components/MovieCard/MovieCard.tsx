import Link from 'next/link'
import Image from 'next/image'
import { Movie } from '@prisma/client'

interface MovieCardProps {
  movie: Movie
}

export default function MovieCard({ movie }: MovieCardProps) {
  const href = movie.type === 'SERIES' 
    ? `/series/${movie.id}` 
    : `/movie/${movie.id}`

  return (
    <Link href={href} className="group">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
        <Image
          src={movie.poster || '/placeholder-poster.jpg'}
          alt={movie.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {movie.rating > 0 && (
          <div className="absolute top-2 right-2 bg-primary px-2 py-1 rounded text-sm font-bold">
            {movie.rating.toFixed(1)}
          </div>
        )}
        {movie.type === 'SERIES' && (
          <div className="absolute top-2 left-2 bg-accent text-black px-2 py-1 rounded text-xs font-bold">
            Серіал
          </div>
        )}
      </div>
      <h3 className="text-white font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
        {movie.title}
      </h3>
      {movie.releaseDate && (
        <p className="text-gray-400 text-xs">
          {new Date(movie.releaseDate).getFullYear()}
        </p>
      )}
    </Link>
  )
}
