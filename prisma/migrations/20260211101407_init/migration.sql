-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "MovieType" AS ENUM ('MOVIE', 'SERIES');

-- CreateEnum
CREATE TYPE "VideoSource" AS ENUM ('EMBED', 'DIRECT', 'PARSED');

-- CreateEnum
CREATE TYPE "AdType" AS ENUM ('PRE_ROLL', 'MID_ROLL', 'POST_ROLL', 'OVERLAY', 'BANNER');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movies" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleOriginal" TEXT,
    "description" TEXT NOT NULL,
    "descriptionShort" TEXT,
    "poster" TEXT NOT NULL,
    "backdrop" TEXT,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "genres" TEXT[],
    "countries" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "type" "MovieType" NOT NULL DEFAULT 'MOVIE',
    "tmdbId" INTEGER,
    "imdbId" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_links" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "source" "VideoSource" NOT NULL,
    "url" TEXT NOT NULL,
    "quality" TEXT DEFAULT '720p',
    "language" TEXT DEFAULT 'uk',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "episodeId" TEXT,

    CONSTRAINT "video_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "thumbnail" TEXT,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AdType" NOT NULL,
    "position" INTEGER DEFAULT 0,
    "adTag" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startTime" INTEGER,
    "endTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "movies_tmdbId_key" ON "movies"("tmdbId");

-- CreateIndex
CREATE INDEX "movies_type_idx" ON "movies"("type");

-- CreateIndex
CREATE INDEX "movies_isActive_idx" ON "movies"("isActive");

-- CreateIndex
CREATE INDEX "movies_releaseDate_idx" ON "movies"("releaseDate" DESC);

-- CreateIndex
CREATE INDEX "movies_views_idx" ON "movies"("views" DESC);

-- CreateIndex
CREATE INDEX "movies_rating_idx" ON "movies"("rating" DESC);

-- CreateIndex
CREATE INDEX "movies_title_idx" ON "movies"("title");

-- CreateIndex
CREATE INDEX "movies_description_idx" ON "movies"("description");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_movieId_seasonNumber_episodeNumber_key" ON "episodes"("movieId", "seasonNumber", "episodeNumber");

-- AddForeignKey
ALTER TABLE "video_links" ADD CONSTRAINT "video_links_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_links" ADD CONSTRAINT "video_links_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
