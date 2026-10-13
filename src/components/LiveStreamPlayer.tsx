import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { StreamChannel } from '../api/football';

interface LiveStreamPlayerProps {
  streams: StreamChannel[];
  title?: string;
  channelLogo?: string;
}

export const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({
  streams,
  title,
  channelLogo,
}) => {
  const [selectedStream, setSelectedStream] = useState<StreamChannel | null>(
    streams[0] || null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Keep selected stream synced with streams prop
  useEffect(() => {
    if (streams.length > 0) {
      const match = streams.find((s) => s.id === selectedStream?.id);
      setSelectedStream(match || streams[0]);
    }
  }, [streams, selectedStream?.id]);

  const initPlayer = useCallback(() => {
    if (!selectedStream?.url || !videoRef.current) return;
    const video = videoRef.current;
    const streamUrl = selectedStream.url;

    setIsLoading(true);
    setHasError(false);

    // Clean up previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Modern browsers allow autoplay if muted
    video.muted = isMuted;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 6,
        levelLoadingTimeOut: 20000,
        levelLoadingMaxRetry: 6,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        startLevel: -1,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay with audio was blocked; muted autoplay ensures stream is running
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          });
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              // Try falling back to native video tag
              if (video.canPlayType('application/vnd.apple.mpegurl')) {
                hls.destroy();
                hlsRef.current = null;
                video.src = streamUrl;
                video.load();
                video
                  .play()
                  .then(() => {
                    setIsPlaying(true);
                    setIsLoading(false);
                  })
                  .catch(() => setHasError(true));
              } else {
                setHasError(true);
                setIsLoading(false);
              }
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari / iOS HLS
      video.src = streamUrl;
      video.load();
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            video.muted = true;
            setIsMuted(true);
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          });
      });
      video.addEventListener('error', () => {
        setHasError(true);
        setIsLoading(false);
      });
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  }, [selectedStream?.url, isMuted]);

  useEffect(() => {
    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [initPlayer, retryCount]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !videoRef.current.muted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const unmuteAndPlay = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = false;
    setIsMuted(false);
    videoRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {});
  };

  const handleReconnect = () => {
    setHasError(false);
    setIsLoading(true);
    setRetryCount((prev) => prev + 1);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    const container = videoRef.current.parentElement;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      container.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="bg-[#0f0f0f] rounded-2xl overflow-hidden border border-[#2a2a2a] shadow-2xl my-2">
      <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden select-none">
        <video
          ref={videoRef}
          className="w-full h-full object-contain cursor-pointer"
          playsInline
          autoPlay
          muted={isMuted}
          controls={false}
          onClick={togglePlay}
          onPlay={() => {
            setIsPlaying(true);
            setIsLoading(false);
          }}
          onPause={() => setIsPlaying(false)}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => setIsLoading(false)}
        />

        {/* Live Badge Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/30 z-10 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] font-black uppercase text-red-400 tracking-wider">
            LIVE
          </span>
          {title && (
            <span className="text-[11px] text-gray-200 font-bold border-l border-white/20 pl-2 ml-1">
              {title}
            </span>
          )}
        </div>

        {/* Channel Logo Watermark */}
        {channelLogo && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/10 z-10 shadow-lg">
            <img
              src={channelLogo}
              alt="Channel"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/channel1-logo.jpg';
              }}
              className="w-7 h-7 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Unmute Prompt Banner if autoplaying muted */}
        {isPlaying && isMuted && (
          <button
            onClick={unmuteAndPlay}
            className="absolute top-14 left-3 flex items-center gap-2 bg-amber-500/90 hover:bg-amber-500 text-black px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg z-10 cursor-pointer"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Tap to Unmute</span>
          </button>
        )}

        {/* Center Loading Spinner */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-15 pointer-events-none">
            <Loader2 className="w-10 h-10 text-[#ff6b35] animate-spin mb-2" />
            <span className="text-xs font-bold text-gray-300 tracking-wide">
              Connecting Live Stream...
            </span>
          </div>
        )}

        {/* Big Center Play Button when paused and not error */}
        {!isPlaying && !isLoading && !hasError && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center z-15 cursor-pointer bg-black/30 hover:bg-black/40 transition-colors"
          >
            <div className="w-16 h-16 rounded-full bg-[#ff6b35] hover:bg-[#ff8354] flex items-center justify-center text-black shadow-2xl transition-transform hover:scale-105">
              <Play className="w-7 h-7 fill-current ml-1" />
            </div>
          </button>
        )}

        {/* Error / Reconnect Overlay */}
        {hasError && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3 text-red-400">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h4 className="text-white font-bold text-sm mb-1">
              Live Stream Connection
            </h4>
            <button
              onClick={handleReconnect}
              className="mt-3 px-4 py-2 bg-[#ff6b35] hover:bg-[#ff8354] text-xs font-bold rounded-xl text-black transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Stream</span>
            </button>
          </div>
        )}

        {/* Custom Video Controls Bar on Hover / Touch */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={toggleMute}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
