# Movie Platform

A modern movie and TV series streaming platform for Ukrainian audience with monetization through video player advertisements.

## Technologies

- **Frontend/Backend**: Next.js 14 (TypeScript)
- **Database**: PostgreSQL (Prisma ORM)
- **Styling**: Tailwind CSS
- **Video Player**: React Player
- **Authentication**: JWT

## Features

- Movie and TV series catalog
- Search and filtering by genres
- Video player with ad support (pre-roll, mid-roll, post-roll)
- Admin panel for content management
- Automatic content import from TMDB API
- Ad management system
- Video link parsing from external sources (no file storage)

## Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL installed and running
- TMDB API key (optional, for auto-import)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` file:
```
DATABASE_URL=postgresql://user:password@localhost:5432/movie-platform
JWT_SECRET=your-secret-key-here
TMDB_API_KEY=your-tmdb-api-key
```

3. Setup database:
```bash
npm run db:generate
npm run db:push
```

4. Create admin user:
```bash
npm run create-admin
```

5. Start development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── components/          # React components (TypeScript)
├── pages/              # Next.js pages and API routes (TypeScript)
├── prisma/             # Prisma schema and migrations
├── types/              # TypeScript types and interfaces
├── utils/              # Utilities (video parsing, TMDB API)
├── middleware/         # Authentication middleware
└── lib/                # Libraries (Prisma client)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Sync schema with database
- `npm run db:migrate` - Create migration
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run create-admin` - Create admin user

## Admin Panel

Access: `/admin/login`

Default credentials:
- Username: `admin`
- Password: `admin123`

### Features:
- Add/edit/delete movies and series
- Import content from TMDB API
- Manage video links
- View statistics

## API Endpoints

### Public
- `GET /api/movies` - List movies
- `GET /api/movies/[id]` - Movie details
- `GET /api/movies/[id]/video` - Video links
- `GET /api/ads` - Ad configuration

### Admin (requires authentication)
- `POST /api/admin/auth/login` - Login
- `GET /api/admin/movies` - List movies (admin)
- `POST /api/admin/movies` - Create movie
- `PUT /api/admin/movies/[id]` - Update movie
- `DELETE /api/admin/movies/[id]` - Delete movie
- `POST /api/admin/import/tmdb` - Import from TMDB

## Database Models

- **Movie** - Movies and TV series
- **VideoLink** - Video source links
- **Episode** - TV series episodes
- **Admin** - Administrators
- **AdConfig** - Advertisement settings

## Video Sources Support

- Direct video links (.mp4, .m3u8, etc.)
- YouTube (embed)
- Ok.ru (parsing or embed)
- VK.com (embed)
- Other embed sources

## Monetization

The platform supports various ad types:
- Pre-roll (before video)
- Mid-roll (during video)
- Post-roll (after video)
- Overlay (over video)
- Page banners

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `TMDB_API_KEY` - The Movie Database API key (optional)
- `NEXT_PUBLIC_SITE_URL` - Site URL

## License

Private project

## Support

For setup instructions and detailed documentation, see the `docs/` folder.
