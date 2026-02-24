import axios from 'axios'
import { VideoLinkParsed } from '@/types'

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

const SUPPORTED_HOSTS = [
  'ashdi.vip',
  'tortuga.wtf',
  'tortuga.tw',
  'vidstreaming.io',
  'streamtape.com',
  'mixdrop.co',
  'upstream.to',
  'streamlare.com',
  'filemoon.sx',
  'doodstream.com',
  'streamwish.to',
  'streamhub.to',
]

export async function parseVideoUrl(url: string): Promise<VideoLinkParsed | null> {
  try {
    if (isSupportedHost(url)) {
      return {
        source: 'embed',
        url: normalizeUrl(url),
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

    return {
      source: 'embed',
      url: normalizeUrl(url),
      quality: 'auto',
    }
  } catch (error) {
    console.error('Error parsing video URL:', error)
    return null
  }
}

function isSupportedHost(url: string): boolean {
  return SUPPORTED_HOSTS.some(host => url.includes(host))
}

function isDirectVideoUrl(url: string): boolean {
  const videoExtensions = ['.mp4', '.m3u8', '.webm', '.mkv', '.avi']
  return videoExtensions.some(ext => url.includes(ext))
}

function normalizeUrl(url: string): string {
  let normalized = url
  
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https:${normalized}`
  }
  
  return normalized
}

export async function searchVideoLinks(movieTitle: string, year?: number): Promise<string[]> {
  const searchQueries = [
    movieTitle,
    year ? `${movieTitle} ${year}` : movieTitle,
    movieTitle.toLowerCase(),
  ]

  const foundLinks: string[] = []

  for (const query of searchQueries) {
    try {
      const links = await Promise.all([
        searchOnHost('ashdi.vip', query),
        searchOnHost('tortuga.wtf', query),
        searchOnHost('vidstreaming.io', query),
      ])

      foundLinks.push(...links.flat().filter(Boolean))
    } catch (error) {
      console.error(`Error searching for ${query}:`, error)
    }
  }

  return Array.from(new Set(foundLinks))
}

async function searchOnHost(host: string, query: string): Promise<string[]> {
  try {
    const searchUrl = getSearchUrl(host, query)
    if (!searchUrl) return []

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'uk-UA,uk;q=0.9',
        'Referer': `https://${host}/`,
      },
      timeout: 10000,
      maxRedirects: 5,
    })

    if (response.data) {
      return extractVideoLinks(host, response.data)
    }
    
    return []
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Error searching on ${host}:`, errorMessage)
    return []
  }
}

function getSearchUrl(host: string, query: string): string | null {
  const encodedQuery = encodeURIComponent(query)
  
  switch (host) {
    case 'ashdi.vip':
      return `https://ashdi.vip/search?q=${encodedQuery}`
    case 'tortuga.wtf':
      return `https://tortuga.wtf/search?q=${encodedQuery}`
    case 'vidstreaming.io':
      return `https://vidstreaming.io/search?q=${encodedQuery}`
    default:
      return null
  }
}

function extractVideoLinks(host: string, html: string): string[] {
  const links: string[] = []
  
  const patterns: { [key: string]: RegExp[] } = {
    'ashdi.vip': [
      /\/vod\/(\d+)/g,
      /\/embed\/(\d+)/g,
      /ashdi\.vip\/vod\/(\d+)/g,
      /ashdi\.vip\/embed\/(\d+)/g,
    ],
    'tortuga.wtf': [
      /\/embed\/([a-zA-Z0-9]+)/g,
      /tortuga\.wtf\/embed\/([a-zA-Z0-9]+)/g,
    ],
    'vidstreaming.io': [
      /\/embed\/([a-zA-Z0-9]+)/g,
      /vidstreaming\.io\/embed\/([a-zA-Z0-9]+)/g,
    ],
  }

  const hostPatterns = patterns[host] || []
  
  for (const pattern of hostPatterns) {
    const matchesArr = Array.from(html.matchAll(pattern))
    for (const match of matchesArr) {
      const videoId = match[1]
      if (host === 'ashdi.vip') {
        links.push(`https://ashdi.vip/vod/${videoId}`)
      } else if (host === 'tortuga.wtf') {
        links.push(`https://tortuga.wtf/embed/${videoId}`)
      } else {
        links.push(`https://${host}/embed/${videoId}`)
      }
    }
  }

  return Array.from(new Set(links))
}

export function validateVideoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  if (isSupportedHost(url) || isDirectVideoUrl(url)) {
    return true
  }
  
  const normalized = normalizeUrl(url)
  try {
    new URL(normalized)
    return true
  } catch {
    if (normalized.startsWith('//')) {
      return true
    }
    return false
  }
}
