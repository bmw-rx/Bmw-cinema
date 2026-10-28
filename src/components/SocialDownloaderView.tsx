import React, { useState, useEffect } from 'react';
import {
  Download,
  ClipboardPaste,
  X,
  Play,
  Film,
  Music,
  Check,
  Copy,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Share2,
} from 'lucide-react';
import {
  resolveSocialMediaDownload,
  SocialDownloadResult,
  detectPlatform,
} from '../services/socialDownloaderService';

export const SocialDownloaderView: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SocialDownloadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Quick paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setUrl(text.trim());
        setError(null);
      }
    } catch (e) {
      // Browser permissions denied or not supported, ignore
    }
  };

  const handleClear = () => {
    setUrl('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Tafadhali weka link ya video.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await resolveSocialMediaDownload(url.trim());
      if (data.success && data.downloads.length > 0) {
        setResult(data);
      } else {
        setError(data.error || 'Imeshindwa kupata video. Hakikisha link ni sahihi na akaunti ni ya wazi (Public).');
      }
    } catch (err: any) {
      setError(err?.message || 'Hitilafu imetokea. Tafadhali jaribu tena.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectDownload = (mediaUrl: string, filename: string, id: string) => {
    setDownloadingId(id);
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = filename || 'video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloadingId(null), 1500);
  };

  const handleCopyLink = async (targetUrl: string, id: string) => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 3000);
    } catch (e) {
      // ignore
    }
  };

  const detected = url ? detectPlatform(url) : null;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6b35]/15 border border-[#ff6b35]/30 text-[#ff6b35] text-xs font-bold uppercase tracking-wider">
          <Download className="w-3.5 h-3.5" />
          <span>Social Media Video Downloader</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Download Videos, Reels & Audio
        </h1>
      </div>

      {/* Input / Paste Bar Form */}
      <div className="bg-[#141416] border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative flex flex-col sm:flex-row items-center gap-2 bg-[#0c0c0e] border border-zinc-700/80 focus-within:border-[#ff6b35] rounded-2xl p-2 transition-all shadow-inner">
            <div className="relative flex-grow w-full flex items-center">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Weka link ya video hapa (Paste link here)..."
                className="w-full bg-transparent text-sm sm:text-base text-white placeholder-gray-500 pl-4 pr-16 py-3 focus:outline-none font-sans"
              />

              {url && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition mr-1 cursor-pointer"
                  title="Clear link"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handlePaste}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-200 text-xs font-semibold border border-zinc-700 transition cursor-pointer shrink-0"
                title="Paste from clipboard"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-[#ff6b35]" />
                <span className="hidden sm:inline">Paste</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] hover:from-[#e55a2b] hover:to-[#ff6b35] disabled:opacity-50 disabled:cursor-not-allowed text-black font-extrabold text-sm uppercase tracking-wider transition-all shadow-lg shadow-[#ff6b35]/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>

          {detected && detected !== 'Social Media' && (
            <div className="flex items-center gap-2 text-[11px] text-gray-400 pl-2">
              <span>Platform detected:</span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[#ff6b35] font-bold">
                {detected}
              </span>
            </div>
          )}
        </form>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 animate-fade-in font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Card with Thumbnail, Details & Downloads */}
      {result && (
        <div className="bg-[#141416] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-fade-in space-y-6 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Thumbnail Preview (`thumbs`) */}
            <div className="md:col-span-5">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 group shadow-lg">
                {result.thumbnail ? (
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                    <Film className="w-12 h-12" />
                  </div>
                )}

                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-extrabold text-[#ff6b35] uppercase tracking-wider border border-zinc-800">
                  {result.platform}
                </div>

                {result.duration && (
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono">
                    {result.duration}
                  </div>
                )}
              </div>
            </div>

            {/* Video Details & Action Options */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white line-clamp-3">
                  {result.title}
                </h2>
                {result.author && (
                  <p className="text-xs text-gray-400 mt-1 font-medium">
                    By <span className="text-white font-semibold">{result.author}</span>
                  </p>
                )}
              </div>

              {/* Downloads Options Grid */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Download Options:
                </span>

                <div className="space-y-2">
                  {result.downloads.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            opt.type === 'audio'
                              ? 'bg-purple-500/15 text-purple-400'
                              : 'bg-[#ff6b35]/15 text-[#ff6b35]'
                          }`}
                        >
                          {opt.type === 'audio' ? (
                            <Music className="w-4 h-4" />
                          ) : (
                            <Film className="w-4 h-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {opt.label}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                            {opt.quality} {opt.size ? `• ${opt.size}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(opt.url, opt.id)}
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 hover:text-white transition cursor-pointer"
                          title="Copy direct download link"
                        >
                          {copiedLink === opt.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDirectDownload(
                              opt.url,
                              `${result.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.${opt.ext || (opt.type === 'audio' ? 'mp3' : 'mp4')}`,
                              opt.id
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff6b35] hover:bg-[#ff8354] text-black font-extrabold text-xs transition cursor-pointer shadow-md shadow-[#ff6b35]/20"
                        >
                          {downloadingId === opt.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reset to download another video */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setUrl('');
                  }}
                  className="text-xs text-gray-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#ff6b35]" />
                  <span>Pakua video nyingine (Download another video)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
