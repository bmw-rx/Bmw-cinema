import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Search,
  RefreshCw,
  Film,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Eye,
  Play,
  Pause,
  Sliders,
  Volume2,
  VolumeX,
  Repeat,
  Share2,
  CheckCircle2,
  Layers,
  ArrowDownToLine,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  PremiumAppItem,
  getPremiumApps,
  incrementAppDownload,
} from '../services/premiumAppService';
import {
  AdultVideoItem,
  fetchAdultVideos,
  incrementAdultVideoViews,
} from '../services/adultService';

export const AppPremiumView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'apps' | 'videos'>('apps');

  // Apps State
  const [apps, setApps] = useState<PremiumAppItem[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appSearch, setAppSearch] = useState('');
  const [downloadingAppId, setDownloadingAppId] = useState<string | null>(null);
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);

  // Videos State
  const [videos, setVideos] = useState<AdultVideoItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoSearch, setVideoSearch] = useState('');
  const [activeVideo, setActiveVideo] = useState<AdultVideoItem | null>(null);
  const [copiedVideoId, setCopiedVideoId] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Video Stream Player Controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [videoFit, setVideoFit] = useState<'contain' | 'cover'>('contain');
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Load Premium Apps
  const loadApps = async () => {
    setLoadingApps(true);
    try {
      const list = await getPremiumApps();
      setApps(list);
    } catch (e) {
      console.error('Error fetching apps:', e);
    } finally {
      setLoadingApps(false);
    }
  };

  // Load Videos
  const loadVideos = async (query = '') => {
    setLoadingVideos(true);
    try {
      const res = await fetchAdultVideos(query);
      if (res.success) {
        setVideos(res.videos);
      }
    } catch (e) {
      console.error('Error fetching videos:', e);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    loadApps();
    loadVideos();

    // Check if URL has a specific video or app query parameter
    const params = new URLSearchParams(window.location.search);
    const videoParam = params.get('v') || params.get('video');
    const appParam = params.get('app') || params.get('appId');
    if (videoParam) {
      setActiveSection('videos');
    } else if (appParam) {
      setActiveSection('apps');
      setAppSearch(appParam);
    }
  }, []);

  // Filtered Apps
  const filteredApps = apps.filter((app) => {
    if (!appSearch.trim()) return true;
    const q = appSearch.toLowerCase();
    return (
      app.id.toLowerCase() === q ||
      app.name.toLowerCase().includes(q) ||
      app.description.toLowerCase().includes(q) ||
      (app.category && app.category.toLowerCase().includes(q))
    );
  });

  // Filtered Videos
  const filteredVideos = videos.filter((v) => {
    if (!videoSearch.trim()) return true;
    const q = videoSearch.toLowerCase();
    return v.title.toLowerCase().includes(q);
  });

  // Handle App Download Click
  const handleDownloadApp = async (app: PremiumAppItem) => {
    setDownloadingAppId(app.id);
    incrementAppDownload(app.id);

    // Update state download count locally
    setApps((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, downloadsCount: (a.downloadsCount || 0) + 1 } : a))
    );

    // Open direct download link safely
    const link = document.createElement('a');
    link.href = app.downloadUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = `${app.name.replace(/[^a-zA-Z0-9]/g, '_')}.apk`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadingAppId(null);
    }, 2000);
  };

  // Share App via Native Web Share or Clipboard
  const handleShareApp = async (app: PremiumAppItem) => {
    const origin = window.location.origin;
    const shareUrl = `${origin}/adult.html?app=${encodeURIComponent(app.name)}`;
    const shareData = {
      title: `${app.name} - App Premium | BMW CINEMA`,
      text: `Pakua ${app.name} (${app.version || 'VIP Mod'}) bure kwenye BMW CINEMA App Premium:`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setShareToast(`App "${app.name}" imeshirikiwa kwa mafanikio!`);
        setTimeout(() => setShareToast(null), 3000);
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedAppId(app.id);
      setShareToast(`Link ya "${app.name}" imenakiliwa! Shiriki popote: ${shareUrl}`);
      setTimeout(() => {
        setCopiedAppId(null);
        setShareToast(null);
      }, 3500);
    } catch (e) {
      // ignore
    }
  };

  // Share App Premium Page
  const handleSharePage = async () => {
    const shareUrl = `${window.location.origin}/adult.html`;
    const shareData = {
      title: 'App Premium - BMW CINEMA',
      text: 'Pakua verified VIP Android & iOS APK applications na unlocked mods bure kwenye BMW CINEMA App Premium:',
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        setShareToast('Ukurasa wa App Premium umeshirikiwa kwa mafanikio!');
        setTimeout(() => setShareToast(null), 3000);
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareToast('Link ya App Premium imenakiliwa!');
      setTimeout(() => setShareToast(null), 3000);
    } catch (e) {
      // ignore
    }
  };

  // Copy App link
  const handleCopyAppLink = async (app: PremiumAppItem) => {
    try {
      await navigator.clipboard.writeText(app.downloadUrl);
      setCopiedAppId(app.id);
      setShareToast(`Download link ya "${app.name}" imenakiliwa!`);
      setTimeout(() => {
        setCopiedAppId(null);
        setShareToast(null);
      }, 2500);
    } catch (e) {
      // ignore
    }
  };

  // Handle Play Video
  const handlePlayVideo = (video: AdultVideoItem) => {
    setActiveVideo(video);
    incrementAdultVideoViews(video.id);
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, views: (Number(v.views) || 0) + 1 } : v))
    );
  };

  // Copy Video Link
  const handleCopyVideoLink = async (video: AdultVideoItem) => {
    try {
      const shareUrl = `${window.location.origin}/adult.html?v=${encodeURIComponent(video.id)}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedVideoId(video.id);
      setShareToast(`Video link copied! Share anywhere: ${shareUrl}`);
      setTimeout(() => {
        setCopiedVideoId(null);
        setShareToast(null);
      }, 3500);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-[#ff6b35]/20 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VIP Unlocked Hub</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-center gap-3 flex-wrap">
            <span>App Premium</span>
            <span className="text-xs sm:text-sm font-bold px-2.5 py-1 rounded-lg bg-[#ff6b35] text-black uppercase tracking-wider">
              Official
            </span>
            <button
              type="button"
              onClick={handleSharePage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/90 hover:bg-[#ff6b35] hover:text-black text-gray-200 text-xs font-bold transition cursor-pointer border border-zinc-700/80 shadow-sm"
              title="Share App Premium Catalog"
            >
              <Share2 className="w-3.5 h-3.5 text-[#ff6b35] hover:text-black transition" />
              <span>Share Hub</span>
            </button>
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            Download verified VIP Android and iOS APK applications, unlocked mods, ad-free streaming engines, and access exclusive video streams in full 4K HD.
          </p>
        </div>

        {/* Navigation Selector */}
        <div className="flex items-center gap-2 bg-[#141416] p-1.5 rounded-2xl border border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSection('apps')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSection === 'apps'
                ? 'bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] text-black shadow-lg shadow-[#ff6b35]/20'
                : 'text-gray-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Premium Apps ({apps.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('videos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeSection === 'videos'
                ? 'bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] text-black shadow-lg shadow-[#ff6b35]/20'
                : 'text-gray-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Exclusive Videos ({videos.length})</span>
          </button>
        </div>
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-zinc-900 border border-[#ff6b35]/50 text-white shadow-2xl flex items-center gap-3 animate-slide-up max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium text-gray-200">{shareToast}</p>
        </div>
      )}

      {/* SECTION 1: PREMIUM APPS */}
      {activeSection === 'apps' && (
        <div className="space-y-6">
          {/* Search & Stats Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#141416] border border-zinc-800 rounded-2xl p-4">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search apps by name, category, or mod..."
                className="w-full bg-[#0c0c0e] border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Virus-Free & Safe Downloads</span>
              </div>
              <button
                type="button"
                onClick={loadApps}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white transition cursor-pointer"
                title="Refresh Apps"
              >
                <RefreshCw className={`w-4 h-4 ${loadingApps ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {loadingApps ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-gray-400 font-medium">Loading Premium Apps Catalog...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-20 text-center bg-[#141416] border border-zinc-800 rounded-3xl p-8">
              <Smartphone className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Apps Found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No premium apps match your current search criteria. Try a different keyword.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="bg-[#141416] border border-zinc-800 hover:border-[#ff6b35]/60 rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-[#ff6b35]/10 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* App Header & Icon */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-black border border-zinc-700/80 shrink-0 shadow-lg relative group-hover:scale-105 transition-transform">
                        {app.icon ? (
                          <img
                            src={app.icon}
                            alt={app.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-500">
                            <Smartphone className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                            {app.badge || 'PRO'}
                          </span>
                          {app.version && (
                            <span className="text-[10px] font-mono text-gray-400 bg-zinc-800/80 px-2 py-0.5 rounded-md">
                              {app.version}
                            </span>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-white mt-1 group-hover:text-[#ff6b35] transition-colors truncate">
                          {app.name}
                        </h3>
                        <p className="text-[11px] text-gray-400 font-medium">
                          {app.category || 'Utility'} {app.size ? `• ${app.size}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Short Description */}
                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                      {app.description}
                    </p>
                  </div>

                  {/* App Footer / Actions */}
                  <div className="pt-5 mt-5 border-t border-zinc-800/80 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
                      <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{app.downloadsCount?.toLocaleString() || 0} Downloads</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Share App Button */}
                      <button
                        type="button"
                        onClick={() => handleShareApp(app)}
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-[#ff6b35] hover:text-black text-gray-200 text-xs font-bold transition cursor-pointer border border-zinc-700/60 hover:border-[#ff6b35] shadow-sm"
                        title={`Share ${app.name}`}
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#ff6b35] group-hover:text-black transition" />
                        <span>Share</span>
                      </button>

                      {/* Copy Download URL */}
                      <button
                        type="button"
                        onClick={() => handleCopyAppLink(app)}
                        className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white transition cursor-pointer border border-zinc-700/60"
                        title="Copy Direct Download Link"
                      >
                        {copiedAppId === app.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      {/* Download App Button */}
                      <button
                        type="button"
                        onClick={() => handleDownloadApp(app)}
                        disabled={downloadingAppId === app.id}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] hover:from-[#e55a2b] hover:to-[#ff6b35] text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-[#ff6b35]/20 hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {downloadingAppId === app.id ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: EXCLUSIVE VIDEOS ("ku upload video usitoe") */}
      {activeSection === 'videos' && (
        <div className="space-y-8">
          {/* Active Video Player Modal / Sticky Box */}
          {activeVideo && (
            <div className="bg-[#141416] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-red-400">
                    Now Playing
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveVideo(null)}
                  className="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-xs font-bold transition cursor-pointer"
                >
                  Close Player
                </button>
              </div>

              {/* Video Player */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-zinc-800">
                <video
                  ref={videoRef}
                  src={activeVideo.downloadUrl}
                  poster={activeVideo.thumbnail}
                  controls
                  autoPlay
                  loop={isLooping}
                  className={`w-full h-full ${videoFit === 'cover' ? 'object-cover' : 'object-contain'}`}
                />
              </div>

              {/* Video Title and Stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">{activeVideo.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 font-mono">
                    <span className="flex items-center gap-1 text-[#ff6b35]">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{Number(activeVideo.views) || 0} Total Views</span>
                    </span>
                    <span>•</span>
                    <span>{activeVideo.duration || '10:00'}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">{activeVideo.quality || '1080p Full HD'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopyVideoLink(activeVideo)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    {copiedVideoId === activeVideo.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-[#ff6b35]" />
                    )}
                    <span>Share Video Link</span>
                  </button>

                  <a
                    href={activeVideo.downloadUrl}
                    download="video.mp4"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff6b35] hover:bg-[#ff8354] text-black text-xs font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Video</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Videos Search & Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#141416] border border-zinc-800 rounded-2xl p-4">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={videoSearch}
                onChange={(e) => setVideoSearch(e.target.value)}
                placeholder="Search exclusive videos..."
                className="w-full bg-[#0c0c0e] border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35]"
              />
            </div>

            <button
              type="button"
              onClick={() => loadVideos(videoSearch)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white transition cursor-pointer"
              title="Refresh Video Catalog"
            >
              <RefreshCw className={`w-4 h-4 ${loadingVideos ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Videos Grid */}
          {loadingVideos ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-gray-400 font-medium">Loading Exclusive Videos...</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="py-20 text-center bg-[#141416] border border-zinc-800 rounded-3xl p-8">
              <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No Videos Found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No videos found. Upload new video links from the Admin panel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-[#141416] border border-zinc-800 hover:border-[#ff6b35]/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-[#ff6b35]/10 flex flex-col group"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => handlePlayVideo(video)}
                    className="relative aspect-video w-full bg-black overflow-hidden cursor-pointer"
                  >
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                        <Film className="w-10 h-10" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                      <div className="w-12 h-12 rounded-full bg-[#ff6b35] text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 fill-black ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono">
                      {video.duration || '10:00'}
                    </div>

                    {video.quality && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 border border-zinc-700 text-[10px] text-[#ff6b35] font-bold">
                        {video.quality}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <h3
                      onClick={() => handlePlayVideo(video)}
                      className="text-sm font-bold text-white group-hover:text-[#ff6b35] transition-colors line-clamp-2 cursor-pointer"
                    >
                      {video.title}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-zinc-800">
                      <span className="flex items-center gap-1 text-[11px] font-mono">
                        <Eye className="w-3.5 h-3.5 text-[#ff6b35]" />
                        <span>{Number(video.views) || 0} Views</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyVideoLink(video)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white transition cursor-pointer"
                          title="Share Video Link"
                        >
                          {copiedVideoId === video.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePlayVideo(video)}
                          className="px-3 py-1 rounded-lg bg-[#ff6b35] hover:bg-[#ff8354] text-black font-extrabold text-[11px] transition cursor-pointer"
                        >
                          Play
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
