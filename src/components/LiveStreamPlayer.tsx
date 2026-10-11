import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize2, AlertCircle } from 'lucide-react';
import { StreamChannel } from '../api/football';

interface LiveStreamPlayerProps {
  streams: StreamChannel[];
  title?: string;
}

export const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({ streams, title }) => {
  const [selectedStream, setSelectedStream] = useState<StreamChannel>(streams[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [useProxy, setUseProxy] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (streams.length > 0 && !streams.some(s => s.id === selectedStream?.id)) {
      setSelectedStream(streams[0]);
    }
  }, [streams, selectedStream]);

  useEffect(() => {
    if (!selectedStream || !videoRef.current) return;
    const video = videoRef.current;
    setHasError(false);

    // Prefer proxy for worker-based CORS streaming if provided, otherwise raw url
    const streamUrl = (useProxy && selectedStream.proxy) ? selectedStream.proxy : selectedStream.url;

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // Try toggling proxy/direct on network fail
              if (useProxy && selectedStream.url) {
                setUseProxy(false);
              } else {
                setHasError(true);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setHasError(true);
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });
    } else {
      setHasError(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedStream, useProxy]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="bg-[#0f0f0f] rounded-2xl overflow-hidden border border-[#2a2a2a] shadow-2xl my-4">
      <div className="relative aspect-video bg-black flex items-center justify-center group">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          controls={false}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Live Badge Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-red-500/30">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] font-black uppercase text-red-400 tracking-wider">LIVE FEED</span>
          {title && <span className="text-[11px] text-gray-300 border-l border-white/20 pl-2 ml-1">{title}</span>}
        </div>

        {/* Error Overlay */}
        {hasError && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center z-20">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-2" />
            <h4 className="text-white font-bold text-sm mb-1">Live Feed Buffering or Reconnecting</h4>
            <p className="text-gray-400 text-xs max-w-sm mb-3">
              The match stream is initializing or awaiting satellite link. Switch to another stream quality below.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setHasError(false);
                  setUseProxy(!useProxy);
                }}
                className="px-3 py-1.5 bg-[#262626] hover:bg-[#333] text-xs font-semibold rounded-lg text-white transition-colors"
              >
                Switch Routing ({useProxy ? 'Direct' : 'Proxy'})
              </button>
            </div>
          </div>
        )}

        {/* Custom Video Controls Bar on Hover */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="text-xs text-gray-300 font-mono font-bold">
              {selectedStream.resolution} {selectedStream.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stream Qualities Ribbon */}
      <div className="p-3 bg-[#141414] border-t border-[#262626] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Available Streams:</span>
          <div className="flex items-center gap-1.5">
            {streams.map((stream, idx) => {
              const isCurrent = stream.id === selectedStream.id;
              return (
                <button
                  key={stream.id || idx}
                  onClick={() => {
                    setSelectedStream(stream);
                    setHasError(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-[#ff6b35] text-black shadow-md shadow-[#ff6b35]/20'
                      : 'bg-[#222] text-gray-300 hover:bg-[#333] hover:text-white border border-[#333]'
                  }`}
                >
                  {stream.resolution || stream.title || `Stream ${idx + 1}`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>HLS Ultra Low Latency</span>
        </div>
      </div>
    </div>
  );
};
