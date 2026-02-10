import axios from 'axios'
import { VideoLinkParsed } from '@/types'

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

export async function parseVideoUrl(url: string): Promise<VideoLinkParsed | null> {
  try {
    if (isEmbedUrl(url)) {
      return {
        source: 'embed',
        url: url,
        quality: 'auto',
      }
    }

    if (isDirectVideoUrl(url)) {
      return {
        source: 'direct',
        url: url,
        quality: 'auto',
      }
    }

    const parsedUrl = await parseExternalSource(url)
    if (parsedUrl) {
      return parsedUrl
    }

    return {
      source: 'embed',
      url: url,
      quality: 'auto',
    }
  } catch (error) {
    console.error('Error parsing video URL:', error)
    return null
  }
}

function isEmbedUrl(url: string): boolean {
  const embedPatterns = [
    /youtube\.com\/embed/,
    /youtube\.com\/v\//,
    /vimeo\.com\/\d+/,
    /dailymotion\.com\/embed/,
    /ok\.ru\/videoembed/,
    /vk\.com\/video/,
  ]
  return embedPatterns.some(pattern => pattern.test(url))
}

function isDirectVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.m3u8', '.webm', '.mkv', '.avi']
  return videoExtensions.some(ext => url.includes(ext))
}

async function parseExternalSource(url: string): Promise<VideoLinkParsed | null> {
  try {
    if (url.includes('ok.ru')) {
      return await parseOkRu(url)
    }
    
    if (url.includes('vk.com')) {
      return await parseVk(url)
    }

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return await parseYouTube(url)
    }

    return null
  } catch (error) {
    console.error('Error parsing external source:', error)
    return null
  }
}

async function parseOkRu(url: string): Promise<VideoLinkParsed | null> {
  try {
    const videoId = extractOkRuId(url)
    if (!videoId) return null

    const response = await axios.get(`https://ok.ru/dk?cmd=videoPlayerMetadata&mid=${videoId}`, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (response.data && response.data.videos) {
      const videos = response.data.videos
      const bestQuality = videos.sort((a: any, b: any) => b.size - a.size)[0]
      return {
        source: 'parsed',
        url: bestQuality.url,
        quality: bestQuality.name || 'auto',
      }
    }

    return {
      source: 'embed',
      url: `https://ok.ru/videoembed/${videoId}`,
      quality: 'auto',
    }
  } catch (error) {
    return {
      source: 'embed',
      url: url,
      quality: 'auto',
    }
  }
}

async function parseVk(url: string): Promise<VideoLinkParsed | null> {
  try {
    return {
      source: 'embed',
      url: url,
      quality: 'auto',
    }
  } catch (error) {
    return null
  }
}

async function parseYouTube(url: string): Promise<VideoLinkParsed | null> {
  try {
    const videoId = extractYouTubeId(url)
    if (!videoId) return null

    return {
      source: 'embed',
      url: `https://www.youtube.com/embed/${videoId}`,
      quality: 'auto',
    }
  } catch (error) {
    return null
  }
}

function extractOkRuId(url: string): string | null {
  const match = url.match(/ok\.ru\/video\/(\d+)/)
  return match ? match[1] : null
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  
  return null
}

export function validateVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
