import React, { useState, useEffect } from 'react';
import {
  Play,
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
} from 'lucide-react';
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

  const loadVideos = async (query = '') => {
    setLoading(true);
    setErrorNotice(null);
    const res = await fetchAdultVideos(query);
    if (res.success) {
      setVideos(res.videos);
      if (res.videos.length === 0) {
        setErrorNotice(null);
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
        return;
      }
    }
    setActiveVideo(video);
  };

  const handleShare = async (video: AdultVideoItem) => {
    const shareUrl = video.downloadUrl || video.rawUrl || window.location.href;
    const shareData = {
      title: video.title,
      text: `Watch ${video.title} on BMW CINEMA`,
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(video.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      // Ignore
    }
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

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Film className="w-7 h-7 text-[#ff6b35]" />
            <span>Adult Cinema</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Premium high-definition video streams and direct downloads.
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
                    title="Share video link"
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

      {/* Video Modal Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#141414] border border-[#262626] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl space-y-4">
            <div className="flex items-center justify-between p-4 border-b border-[#242424]">
              <h2 className="text-base font-bold text-white truncate max-w-lg">
                {activeVideo.title}
              </h2>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 rounded-lg bg-[#222] hover:bg-[#333] text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                {activeVideo.downloadUrl ? (
                  <video
                    src={activeVideo.downloadUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    Video stream currently unavailable.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#111] border-t border-[#222]">
              <button
                onClick={() => handleShare(activeVideo)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#222] hover:bg-[#2c2c2c] text-gray-300 hover:text-white text-xs font-semibold transition"
              >
                {copiedId === activeVideo.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Share Video</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownload(activeVideo)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff6b35] hover:bg-[#ff8354] text-black text-xs font-black transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Video</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
