"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { WS_BASE } from "@/lib/api";
import { Scan, Focus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Detection {
  plate_number: string;
  confidence: number;
  formatted_plate: string;
  is_blacklisted: boolean;
}

export default function FullscreenDetector() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Automatically connect to WebSocket stream for camera detection
      const wsUrl = `${WS_BASE}/api/v1/stream/ws/mobile-camera`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsStreaming(true);
        setError(null);
        sendFrames(ws);
      };
      
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.detections?.length > 0) {
          setDetections(data.detections);
          // Play a small notification or show alert for blacklisted
          data.detections.forEach((d: Detection) => {
            if (d.is_blacklisted) {
              toast.error(`WANTED VEHICLE: ${d.plate_number}`, { duration: 5000, icon: '🚨' });
            }
          });
        }
      };
      
      ws.onerror = () => setError("Failed to connect to detection server.");
      ws.onclose = () => setIsStreaming(false);

    } catch (err: any) {
      setError("Camera access required for detection.");
      toast.error("Please allow camera permissions.");
    }
  }, []);

  const sendFrames = (ws: WebSocket) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const send = () => {
      if (ws.readyState !== WebSocket.OPEN) return;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0);
      const b64 = canvas.toDataURL("image/jpeg", 0.7);
      ws.send(JSON.stringify({ frame: b64 }));
      
      // Stream at 3 fps for snappy detection
      setTimeout(send, 333); 
    };
    send();
  };

  useEffect(() => {
    startCamera();
    return () => {
      wsRef.current?.close();
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col justify-center items-center">
      {error ? (
        <div className="z-10 text-center space-y-4 px-6">
          <div className="w-16 h-16 bg-red-900/40 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Focus size={32} />
          </div>
          <p className="text-white text-lg font-medium">{error}</p>
          <button 
            onClick={startCamera} 
            className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning Overlay UI */}
          <div className="absolute inset-0 pointer-events-none border-[8px] border-brand-500/20" />
          
          <div className="absolute top-10 left-0 right-0 z-10 flex justify-center pointer-events-none">
            <div className="bg-black/40 backdrop-blur-md px-6 py-2.5 rounded-full border border-white/10 flex items-center gap-3">
              {isStreaming ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-green animate-pulse" />
                  <span className="text-white font-medium tracking-wide text-sm">LIVELY DETECTING...</span>
                </>
              ) : (
                <>
                  <Loader2 size={16} className="text-brand-400 animate-spin" />
                  <span className="text-white font-medium tracking-wide text-sm">CONNECTING ENGINE</span>
                </>
              )}
            </div>
          </div>

          {/* Detections Display */}
          {detections.length > 0 && (
            <div className="absolute bottom-12 left-0 right-0 z-20 px-6 flex flex-col gap-3 items-center w-full max-w-md mx-auto pointer-events-none">
              {detections.map((d, i) => (
                <div 
                  key={i} 
                  className={`w-full p-4 rounded-2xl backdrop-blur-xl border shadow-2xl animate-fade-in flex items-center justify-between ${
                    d.is_blacklisted 
                      ? "bg-red-900/80 border-red-500 shadow-red-900/50" 
                      : "bg-black/60 border-brand-500 shadow-brand-900/30"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${d.is_blacklisted ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/20 text-brand-400'}`}>
                      <Scan size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold font-mono text-white tracking-wider">
                        {d.formatted_plate || d.plate_number}
                      </h3>
                      {d.is_blacklisted && (
                        <p className="text-red-400 font-bold text-xs uppercase tracking-wide mt-1">Alert: Blacklisted Vehicle</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[var(--text-muted)] font-medium uppercase tracking-wider mb-1">Match</div>
                    <div className="text-emerald-400 font-mono text-lg font-bold">{(d.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
