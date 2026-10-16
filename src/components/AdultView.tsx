import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Download,
  Share2,
  Search,
  RefreshCw,
  Film,
  X,
  Check,
  ExternalLink,
  Clock,
  Sparkles,
  Eye,
  Settings,
  Maximize2,
  Repeat,
  Volume2,
  VolumeX,
  Volume1,
  Sliders,
  Tv,
  Copy,
  RotateCcw,
  RotateCw,
  MessageCircle,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  AdultVideoItem,
  fetchAdultVideos,
  resolveVideoDetails,
  incrementAdultVideoViews,
} from '../services/adultService';

export const AdultView: React.FC = () => {
  const [videos, setVideos] = useState<AdultVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<AdultVideoItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [shareModalVideo, setShareModalVideo] = useState<AdultVideoItem | null>(null);

  // Video Stream Player Settings & Controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [videoFit, setVideoFit] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [streamQuality, setStreamQuality] = useState<string>('Auto (1080p HD)');
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const loadVideos = async (query = '') => {
    setLoading(true);
    setErrorNotice(null);
    const res = await fetchAdultVideos(query);
    if (res.success) {
      setVideos(res.videos);
      if (res.videos.length === 0) {
        setErrorNotice(null);
      }

      // Check if URL has direct video parameter ?v=... or ?video=... or hash
      const urlParams = new URLSearchParams(window.location.search);
      let targetId = urlParams.get('v') || urlParams.get('video');
      if (!targetId && window.location.hash) {
        const hashQuery = window.location.hash.split('?')[1];
        if (hashQuery) {
          const hp = new URLSearchParams(hashQuery);
          targetId = hp.get('v') || hp.get('video');
        }
      }

      if (targetId) {
        const found = res.videos.find((v) => v.id === targetId);
        if (found) {
          handlePlayVideo(found);
        } else {
          // If not in standard list, query Firestore directly
          try {
            const docRef = doc(db, 'adult_videos', targetId);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              const data = snap.data();
              const item: AdultVideoItem = {
                id: snap.id,
                title: data.title || 'Exclusive Video',
                downloadUrl: data.downloadUrl || '',
                thumbnail: data.thumbnail || '',
                duration: data.duration || '10:00',
                quality: data.quality || '1080p Full HD',
                views: data.views || 0,
                isCustom: true,
              };
              setVideos((prev) => [item, ...prev]);
              handlePlayVideo(item);
            }
          } catch (e) {
            // ignore
          }
        }
      }
    } else {
      setVideos([]);
      if (res.error) {
        setErrorNotice(res.error);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadVideos(searchQuery);
  };

  const handlePlayVideo = async (video: AdultVideoItem) => {
    // Increment views in Firestore
    incrementAdultVideoViews(video.id).then((newViews) => {
      if (newViews !== null) {
        setVideos((prev) =>
          prev.map((v) => (v.id === video.id ? { ...v, views: newViews } : v))
        );
      }
    });

    if (!video.downloadUrl && video.rawUrl) {
      setResolvingId(video.id);
      const details = await resolveVideoDetails(video.rawUrl);
      setResolvingId(null);
      if (details) {
        const updated: AdultVideoItem = {
          ...video,
          downloadUrl: details.downloadUrl || video.downloadUrl,
          thumbnail: details.thumbnail || video.thumbnail,
          duration: details.duration || video.duration,
          views: details.views || video.views,
        };
        setVideos((prev) => prev.map((v) => (v.id === video.id ? updated : v)));
        setActiveVideo(updated);
        setPlaybackSpeed(1.0);
        setShowSettings(false);
        return;
      }
    }

    setActiveVideo(video);
    setPlaybackSpeed(1.0);
    setShowSettings(false);
  };

  /**
   * Generates a protected website deep link pointing directly to this video
   * (NEVER reveals, leaks, or shares raw uploaded storage / media links)
   */
  const getWebsiteShareUrl = (video: AdultVideoItem) => {
    const origin = window.location.origin;
    return `${origin}/?page=adult&v=${encodeURIComponent(video.id)}`;
  };

  const handleShare = (video: AdultVideoItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShareModalVideo(video);
  };

  const handleCopyShareLink = async (video: AdultVideoItem) => {
    const shareUrl = getWebsiteShareUrl(video);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(video.id);
      setShareToast('Link ya video imenakiliwa! Mtazamaji akifungua atapelekwa moja kwa moja kutazama video hii kwenye BMW CINEMA.');
      setTimeout(() => {
        setCopiedId(null);
        setShareToast(null);
      }, 4000);
    } catch (err) {
      // Fallback
    }
  };

  const handleNativeShare = async (video: AdultVideoItem) => {
    const shareUrl = getWebsiteShareUrl(video);
    const shareData = {
      title: `${video.title} - BMW CINEMA`,
      text: `Tazama "${video.title}" kwenye BMW CINEMA:`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setShareToast('Video link shared successfully!');
        setTimeout(() => setShareToast(null), 3000);
        return;
      } catch (err) {
        // Fallback
      }
    }
    handleCopyShareLink(video);
  };

  const handleDownload = async (video: AdultVideoItem) => {
    let dlUrl = video.downloadUrl;
    if (!dlUrl && video.rawUrl) {
      setResolvingId(video.id);
      const details = await resolveVideoDetails(video.rawUrl);
      setResolvingId(null);
      if (details?.downloadUrl) {
        dlUrl = details.downloadUrl;
        const updated: AdultVideoItem = {
          ...video,
          downloadUrl: details.downloadUrl,
          thumbnail: details.thumbnail || video.thumbnail,
          duration: details.duration || video.duration,
          views: details.views || video.views,
        };
        setVideos((prev) => prev.map((v) => (v.id === video.id ? updated : v)));
      }
    }

    if (!dlUrl) return;
    const link = document.createElement('a');
    link.href = dlUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = `${video.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Change playback speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Toggle video loop
  const handleToggleLoop = () => {
    const next = !isLooping;
    setIsLooping(next);
    if (videoRef.current) {
      videoRef.current.loop = next;
    }
  };

  // Seek forward / backward
  const handleSeek = (offsetSeconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + offsetSeconds);
    }
  };

  // Volume & Mute control
  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    if (videoRef.current) {
      videoRef.current.volume = clamped;
      videoRef.current.muted = clamped === 0;
    }
    setIsMuted(clamped === 0);
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      const next = !isMuted;
      videoRef.current.muted = next;
      setIsMuted(next);
      if (!next && volume === 0) {
        setVolume(1.0);
        videoRef.current.volume = 1.0;
      }
    }
  };

  // Picture in picture
  const handleTogglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      // ignore
    }
  };

  // Fullscreen
  const handleToggleFullscreen = () => {
    const el = playerContainerRef.current || videoRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Keyboard Shortcuts while playing
  useEffect(() => {
    if (!activeVideo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (videoRef.current) {
          if (videoRef.current.paused) videoRef.current.play();
          else videoRef.current.pause();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(-10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeek(10);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(Math.min(1, volume + 0.1));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(Math.max(0, volume - 0.1));
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (e.key === 'Escape') {
        setActiveVideo(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideo, volume, isMuted]);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Toast Notification for Share / Copy */}
      {shareToast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-[#1c1c1f] border border-[#ff6b35]/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs animate-bounce font-medium">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Film className="w-7 h-7 text-[#ff6b35]" />
            <span>Adult Cinema</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Premium high-definition video streams, custom curated features, and direct downloads.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="relative flex-grow sm:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos..."
              className="w-full bg-[#161616] border border-[#2d2d2d] focus:border-[#ff6b35] focus:outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 transition-colors"
            />
          </form>

          <button
            onClick={() => loadVideos(searchQuery)}
            title="Refresh videos"
            className="p-2.5 rounded-xl bg-[#161616] hover:bg-[#222] text-gray-300 hover:text-white border border-[#2d2d2d] transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#ff6b35]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {errorNotice && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 text-center">
          {errorNotice}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 py-12">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#141414] rounded-2xl border border-[#222] overflow-hidden animate-pulse">
              <div className="aspect-video bg-[#202020]" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-[#252525] rounded w-3/4" />
                <div className="h-3 bg-[#202020] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        /* Clean empty state (No demo videos) */
        <div className="text-center py-24 space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#2d2d2d] flex items-center justify-center mx-auto text-gray-500">
            <Film className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Videos Available</h3>
            <p className="text-xs text-gray-400 mt-1">
              Content feed is currently updating. Please check back shortly.
            </p>
          </div>
          <button
            onClick={() => loadVideos()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6b35] hover:bg-[#ff8354] text-black font-bold text-xs rounded-xl transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check For Updates</span>
          </button>
        </div>
      ) : (
        /* Video Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="group bg-[#141414] hover:bg-[#1a1a1a] border border-[#242424] hover:border-[#ff6b35]/50 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-lg"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => handlePlayVideo(video)}
                className="relative aspect-video w-full bg-[#0a0a0a] overflow-hidden cursor-pointer"
              >
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#181818] text-gray-600">
                    <Film className="w-10 h-10" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#ff6b35] text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    {resolvingId === video.id ? (
                      <RefreshCw className="w-5 h-5 text-black animate-spin" />
                    ) : (
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    )}
                  </div>
                </div>

                {video.duration && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-medium text-white flex items-center gap-1 backdrop-blur-sm">
                    <Clock className="w-3 h-3 text-[#ff6b35]" />
                    {video.duration}
                  </span>
                )}

                {video.quality && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#ff6b35] text-[9px] font-extrabold text-black uppercase tracking-wider">
                    {video.quality}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3
                    onClick={() => handlePlayVideo(video)}
                    title={video.title}
                    className="font-bold text-sm text-white hover:text-[#ff6b35] transition-colors line-clamp-2 cursor-pointer"
                  >
                    {video.title}
                  </h3>

                  <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1 font-medium">
                      <Eye className="w-3.5 h-3.5 text-[#ff6b35]" />
                      <span>{typeof video.views === 'number' ? video.views.toLocaleString() : video.views || 0} views</span>
                    </span>

                    {video.isCustom && (
                      <span className="px-1.5 py-0.5 rounded bg-[#ff6b35]/20 text-[#ff6b35] text-[9px] font-bold uppercase tracking-wider">
                        Featured
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: Download & Share */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#222]">
                  <button
                    type="button"
                    onClick={() => handleDownload(video)}
                    disabled={resolvingId === video.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#202020] hover:bg-[#ff6b35] text-gray-200 hover:text-black font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Download video"
                  >
                    {resolvingId === video.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ff6b35]" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{resolvingId === video.id ? 'Loading...' : 'Download'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShare(video)}
                    className="p-2 rounded-xl bg-[#202020] hover:bg-[#282828] text-gray-300 hover:text-white transition-colors cursor-pointer"
                    title="Share website link for this video"
                  >
                    {copiedId === video.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Advanced Video Modal Player with Stream Settings */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div
            ref={playerContainerRef}
            className="bg-[#141416] border border-[#2a2a2e] rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col relative max-h-[95vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#242426] bg-[#18181b]">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-8 h-8 rounded-xl bg-[#ff6b35]/20 flex items-center justify-center text-[#ff6b35] shrink-0">
                  <Film className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-md sm:max-w-xl">
                    {activeVideo.title}
                  </h2>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <Eye className="w-3 h-3" />
                      <span>{typeof activeVideo.views === 'number' ? activeVideo.views.toLocaleString() : activeVideo.views || 0} views</span>
                    </span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-gray-300 font-mono text-[10px]">
                      {activeVideo.quality || '1080p HD'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Stream Settings Trigger Button */}
                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    showSettings
                      ? 'bg-[#ff6b35] text-black border-[#ff6b35]'
                      : 'bg-zinc-800/90 hover:bg-zinc-700 text-gray-200 border-zinc-700'
                  }`}
                  title="Configure Video Stream Settings"
                >
                  <Settings className={`w-3.5 h-3.5 ${showSettings ? 'rotate-90' : ''} transition-transform`} />
                  <span className="hidden sm:inline">Settings</span>
                </button>

                <button
                  onClick={() => setActiveVideo(null)}
                  className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white transition cursor-pointer"
                  title="Close player"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Player Display */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {activeVideo.downloadUrl ? (
                <video
                  ref={videoRef}
                  src={activeVideo.downloadUrl}
                  controls
                  autoPlay
                  loop={isLooping}
                  className={`w-full h-full ${videoFit === 'cover' ? 'object-cover' : 'object-contain'}`}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-6 space-y-2">
                  <Film className="w-12 h-12 text-zinc-700" />
                  <p className="text-xs">Direct video stream is loading or preparing...</p>
                </div>
              )}

              {/* Stream Settings Overlay Panel */}
              {showSettings && (
                <div className="absolute top-3 right-3 z-30 w-72 bg-[#121214]/95 border border-zinc-700 backdrop-blur-md rounded-2xl p-4 shadow-2xl text-xs space-y-4 animate-fade-in text-white">
                  <div className="flex items-center justify-between border-b border-zinc-700/80 pb-2">
                    <span className="font-bold flex items-center gap-1.5 text-white">
                      <Sliders className="w-3.5 h-3.5 text-[#ff6b35]" />
                      <span>Stream Settings</span>
                    </span>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Playback Speed */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Playback Speed
                    </label>
                    <div className="grid grid-cols-6 gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
                      {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => handleSpeedChange(rate)}
                          className={`py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                            playbackSpeed === rate
                              ? 'bg-[#ff6b35] text-black shadow-sm'
                              : 'text-gray-300 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video Fit (Contain vs Cover vs Fill) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Display Aspect & Fit
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setVideoFit('contain')}
                        className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition cursor-pointer text-center ${
                          videoFit === 'contain'
                            ? 'bg-[#ff6b35]/20 border-[#ff6b35] text-[#ff6b35]'
                            : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        Fit (Default)
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoFit('cover')}
                        className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition cursor-pointer text-center ${
                          videoFit === 'cover'
                            ? 'bg-[#ff6b35]/20 border-[#ff6b35] text-[#ff6b35]'
                            : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        Zoom to Fill
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoFit('fill')}
                        className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition cursor-pointer text-center ${
                          videoFit === 'fill'
                            ? 'bg-[#ff6b35]/20 border-[#ff6b35] text-[#ff6b35]'
                            : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        Stretch 16:9
                      </button>
                    </div>
                  </div>

                  {/* Volume Control */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      <span>Audio Level</span>
                      <span className="font-mono text-gray-300">{Math.round(volume * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
                      <button
                        type="button"
                        onClick={handleToggleMute}
                        className="text-gray-300 hover:text-[#ff6b35] transition cursor-pointer"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4 text-red-400" />
                        ) : volume > 0.5 ? (
                          <Volume2 className="w-4 h-4" />
                        ) : (
                          <Volume1 className="w-4 h-4" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        className="w-full accent-[#ff6b35] cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Loop Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-[#ff6b35]" />
                      <span>Loop Video</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleLoop}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition cursor-pointer ${
                        isLooping
                          ? 'bg-emerald-500 text-black'
                          : 'bg-zinc-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {isLooping ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Stream Quality Indicator */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Quality Resolution</span>
                    <span className="font-mono text-[#ff6b35] font-semibold">
                      {activeVideo.quality || '1080p HD'} (Direct Stream)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Controls Bar */}
            <div className="flex flex-wrap items-center justify-between p-4 bg-[#111113] border-t border-[#222] gap-3">
              <div className="flex items-center gap-2">
                {/* 10s Backward */}
                <button
                  type="button"
                  onClick={() => handleSeek(-10)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white border border-zinc-700 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Rewind 10 seconds (Left Arrow)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono">-10s</span>
                </button>

                {/* 10s Forward */}
                <button
                  type="button"
                  onClick={() => handleSeek(10)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white border border-zinc-700 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                  title="Fast forward 10 seconds (Right Arrow)"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono">+10s</span>
                </button>

                {/* Volume / Mute button in bar */}
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white border border-zinc-700 transition cursor-pointer"
                  title="Toggle Mute (M)"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                {/* Share Link Button */}
                <button
                  type="button"
                  onClick={(e) => handleShare(activeVideo, e)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-[#ff6b35] hover:text-black text-gray-200 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
                  title="Share BMW CINEMA link for this video"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Video</span>
                </button>

                {/* PiP Button */}
                <button
                  type="button"
                  onClick={handleTogglePiP}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white text-xs font-semibold border border-zinc-700 transition cursor-pointer"
                  title="Picture in Picture Mode"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Floating</span>
                </button>

                {/* Fullscreen Button */}
                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white border border-zinc-700 transition cursor-pointer"
                  title="Toggle Fullscreen (F)"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
                  Speed: {playbackSpeed}x
                </span>

                <button
                  type="button"
                  onClick={() => handleDownload(activeVideo)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff6b35] hover:bg-[#ff8354] text-black text-xs font-black transition cursor-pointer shadow-md shadow-[#ff6b35]/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Share Video Modal with WhatsApp & Protected Copy Link */}
      {shareModalVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141416] border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-5 p-6 animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#ff6b35]/20 text-[#ff6b35] flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Share Video</h3>
                  <p className="text-[11px] text-gray-400">Share with friends on social media or copy link</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareModalVideo(null)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video preview chip */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800">
              {shareModalVideo.thumbnail ? (
                <img
                  src={shareModalVideo.thumbnail}
                  alt={shareModalVideo.title}
                  className="w-16 h-11 object-cover rounded-xl shrink-0"
                />
              ) : (
                <div className="w-16 h-11 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0 text-zinc-600">
                  <Film className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{shareModalVideo.title}</div>
                <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <Eye className="w-3 h-3" />
                  <span>{typeof shareModalVideo.views === 'number' ? shareModalVideo.views.toLocaleString() : shareModalVideo.views || 0} views</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400 font-mono">{shareModalVideo.duration || '10:00'}</span>
                </div>
              </div>
            </div>

            {/* Protected URL Box */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-gray-300">
                BMW CINEMA Stream Link:
              </label>
              <div className="flex items-center gap-2 bg-[#0c0c0e] border border-zinc-800 rounded-xl p-1.5 pl-3">
                <input
                  type="text"
                  readOnly
                  value={getWebsiteShareUrl(shareModalVideo)}
                  className="bg-transparent text-xs text-gray-300 font-mono outline-none flex-1 truncate select-all"
                />
                <button
                  type="button"
                  onClick={() => handleCopyShareLink(shareModalVideo)}
                  className="px-3 py-1.5 rounded-lg bg-[#ff6b35] hover:bg-[#ff8354] text-black text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedId === shareModalVideo.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-emerald-400/90 flex items-center gap-1 pt-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Link hii itamfungulia mtazamaji video hii kwenye BMW CINEMA (faili halisi limefichwa).</span>
              </p>
            </div>

            {/* Social Share Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const url = getWebsiteShareUrl(shareModalVideo);
                  const text = `Tazama "${shareModalVideo.title}" kwenye BMW CINEMA:\n${url}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-emerald-900/20"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const url = getWebsiteShareUrl(shareModalVideo);
                  const text = `Tazama "${shareModalVideo.title}" kwenye BMW CINEMA`;
                  window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-sky-900/20"
              >
                <Send className="w-4 h-4" />
                <span>Telegram</span>
              </button>
            </div>

            {/* Mobile Native Share option if available */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={() => handleNativeShare(shareModalVideo)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-200 text-xs font-semibold border border-zinc-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#ff6b35]" />
                <span>More Share Options (Apps)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
