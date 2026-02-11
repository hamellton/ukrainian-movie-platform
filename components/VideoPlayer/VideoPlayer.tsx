import { useEffect, useMemo, useRef, useState } from 'react'
import ReactPlayer from 'react-player'
import useSWR from 'swr'
import { VideoLink, AdConfig } from '@prisma/client'

interface VideoPlayerProps {
  movieId: string
  episodeNumber?: number
  seasonNumber?: number
  onEnd?: () => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function VideoPlayer({ movieId, episodeNumber, seasonNumber, onEnd }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [played, setPlayed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showPreRoll, setShowPreRoll] = useState(true)
  const [showMidRoll, setShowMidRoll] = useState(false)
  const [showPostRoll, setShowPostRoll] = useState(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const playerRef = useRef<ReactPlayer>(null)

  const videoUrl = `/api/movies/${movieId}/video${episodeNumber ? `?episodeNumber=${episodeNumber}&seasonNumber=${seasonNumber}` : ''}`
  const { data: videoData } = useSWR<{ videoLinks: VideoLink[] }>(videoUrl, fetcher)
  const { data: adsData } = useSWR<{ ads: AdConfig[] }>('/api/ads', fetcher)

  const videoLinks = videoData?.videoLinks || []
  const ads = useMemo(() => adsData?.ads || [], [adsData?.ads])

  useEffect(() => {
    if (showPreRoll && ads.length > 0) {
      const preRollAd = ads.find(ad => ad.type === 'PRE_ROLL' && ad.isActive)
      if (preRollAd) {
        setTimeout(() => {
          setShowPreRoll(false)
        }, 5000)
      } else {
        setShowPreRoll(false)
      }
    }
  }, [showPreRoll, ads])

  useEffect(() => {
    if (played > 0 && duration > 0 && !showMidRoll) {
      const midRollAd = ads.find(ad => ad.type === 'MID_ROLL' && ad.isActive)
      if (midRollAd && midRollAd.position) {
        const adTime = (midRollAd.position / 100) * duration
        if (played >= adTime - 5 && played <= adTime + 5) {
          setShowMidRoll(true)
          setPlaying(false)
          setTimeout(() => {
            setShowMidRoll(false)
            setPlaying(true)
          }, 15000)
        }
      }
    }
  }, [played, duration, ads, showMidRoll])

  const handleProgress = (state: { playedSeconds: number }) => {
    setPlayed(state.playedSeconds)
  }

  const handleDuration = (duration: number) => {
    setDuration(duration)
  }

  const handleEnded = () => {
    const postRollAd = ads.find(ad => ad.type === 'POST_ROLL' && ad.isActive)
    if (postRollAd) {
      setShowPostRoll(true)
      setTimeout(() => {
        setShowPostRoll(false)
        if (onEnd) onEnd()
      }, 10000)
    } else {
      if (onEnd) onEnd()
    }
  }

  const handleError = () => {
    if (currentVideoIndex < videoLinks.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1)
    }
  }

  const isSpecializedHost = (url: string): boolean => {
    const specializedHosts = [
      'ashdi.vip',
      'tortuga.wtf',
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
    return specializedHosts.some(host => url.includes(host))
  }

  if (!videoLinks.length) {
    return (
      <div className="w-full aspect-video bg-black flex items-center justify-center">
        <p className="text-gray-400">Відео недоступне</p>
      </div>
    )
  }

  const currentVideo = videoLinks[currentVideoIndex]

  return (
    <div className="w-full aspect-video bg-black relative">
      {showPreRoll && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center">
            <p className="text-white mb-4">Реклама</p>
            <div className="w-full max-w-2xl h-96 bg-gray-900 flex items-center justify-center">
              <p className="text-gray-400">Рекламний блок</p>
            </div>
          </div>
        </div>
      )}

      {showMidRoll && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center">
            <p className="text-white mb-4">Реклама</p>
            <div className="w-full max-w-2xl h-96 bg-gray-900 flex items-center justify-center">
              <p className="text-gray-400">Рекламний блок</p>
            </div>
          </div>
        </div>
      )}

      {showPostRoll && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center">
            <p className="text-white mb-4">Реклама</p>
            <div className="w-full max-w-2xl h-96 bg-gray-900 flex items-center justify-center">
              <p className="text-gray-400">Рекламний блок</p>
            </div>
          </div>
        </div>
      )}

      {isSpecializedHost(currentVideo.url) ? (
        <iframe
          src={currentVideo.url.includes('ashdi.vip/vod/') 
            ? currentVideo.url.replace('/vod/', '/embed/')
            : currentVideo.url.startsWith('//') 
            ? `https:${currentVideo.url}`
            : currentVideo.url}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="w-full h-full"
          style={{ border: 'none' }}
        />
      ) : (
        <ReactPlayer
          ref={playerRef}
          url={currentVideo.url}
          playing={playing && !showPreRoll && !showMidRoll && !showPostRoll}
          controls={true}
          width="100%"
          height="100%"
          onProgress={handleProgress}
          onDuration={handleDuration}
          onEnded={handleEnded}
          onError={handleError}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload',
              },
            },
          }}
        />
      )}
    </div>
  )
}
