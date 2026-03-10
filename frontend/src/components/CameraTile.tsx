"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { WS_BASE } from "@/lib/api";
import { Video, VideoOff, Scan } from "lucide-react";
import toast from "react-hot-toast";

interface Detection {
  plate_number: string;
  confidence: number;
  formatted_plate: string;
  is_blacklisted: boolean;
  bbox?: number[];
}

interface CameraTileProps {
  cameraId: string;
  label: string;
  token: string | null;
}

export default function CameraTile({ cameraId, label, token }: CameraTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [fps, setFps] = useState(0);
  const fpsCountRef = useRef(0);

  const startStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const wsUrl = `${WS_BASE}/api/v1/stream/ws/${cameraId}${token ? `?token=${token}` : ""}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsStreaming(true);
        sendFrames(ws);
      };
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.detections?.length > 0) {
          setDetections(data.detections);
          fpsCountRef.current++;
          data.detections.forEach((d: Detection) => {
            if (d.is_blacklisted) {
              toast.error(`🚨 Blacklisted: ${d.plate_number}`, { duration: 6000 });
            }
          });
        }
      };
      ws.onerror = () => toast.error("WebSocket error");
      ws.onclose = () => setIsStreaming(false);
    } catch (err) {
      toast.error("Camera access denied. Please allow camera permission.");
    }
  }, [cameraId, token]);

  const sendFrames = (ws: WebSocket) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const send = () => {
      if (ws.readyState !== WebSocket.OPEN) return;
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      ctx.drawImage(video, 0, 0);
      const b64 = canvas.toDataURL("image/jpeg", 0.7);
      ws.send(JSON.stringify({ frame: b64 }));
      setTimeout(send, 500); // 2fps to backend
    };
    send();
  };

  const stopStream = () => {
    wsRef.current?.close();
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsStreaming(false);
    setDetections([]);
  };

  // FPS counter
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(fpsCountRef.current);
      fpsCountRef.current = 0;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card overflow-hidden glow-blue">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[rgba(42,82,130,0.2)]">
        <div className="flex items-center gap-2">
          <span className={`status-dot ${isStreaming ? "online" : "offline"}`} />
          <span className="text-sm font-medium text-white">{label}</span>
          <span className="text-xs text-[var(--text-muted)]">({cameraId})</span>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <span className="text-xs font-mono text-accent-green">{fps} det/s</span>
          )}
          <button
            onClick={isStreaming ? stopStream : startStream}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
              isStreaming
                ? "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30"
                : "bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 border border-brand-600/30"
            }`}
          >
            {isStreaming ? <VideoOff size={13} /> : <Video size={13} />}
            {isStreaming ? "Stop" : "Live"}
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="relative bg-dark-900 aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center">
              <Video size={22} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-xs text-[var(--text-muted)]">Click Live to start stream</p>
          </div>
        )}

        {isStreaming && <div className="scan-line" />}

        {/* Detected plates overlay */}
        {isStreaming && detections.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 space-y-1">
            {detections.slice(0, 3).map((d, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs backdrop-blur-md ${
                  d.is_blacklisted
                    ? "bg-red-900/70 border border-red-500/50"
                    : "bg-dark-800/80 border border-[rgba(42,82,130,0.4)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Scan size={12} className={d.is_blacklisted ? "text-red-400" : "text-brand-400"} />
                  <span className="plate-badge text-xs">{d.formatted_plate || d.plate_number}</span>
                  {d.is_blacklisted && (
                    <span className="text-red-400 font-bold">⚠ WANTED</span>
                  )}
                </div>
                <span className="text-[var(--text-muted)]">{(d.confidence * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
