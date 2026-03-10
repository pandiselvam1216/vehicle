"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadImage, uploadVideo } from "@/lib/api";
import { Upload, CloudUpload, FileVideo, Image, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type Result = {
  plate_number: string;
  confidence: number;
  formatted_plate: string;
  is_valid_format: string;
  source: string;
  detected_at: string;
};

export default function UploadPage() {
  const [tab, setTab] = useState<"image" | "video">("image");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    if (tab === "image") {
      setPreview(URL.createObjectURL(file));
    }
    setLoading(true);
    setResults([]);
    try {
      const res = tab === "image"
        ? await uploadImage(file)
        : await uploadVideo(file);
      setResults(res.data.detections);
      toast.success(`${res.data.count} plate(s) detected!`);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Detection failed");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: tab === "image"
      ? { "image/*": [".jpg", ".jpeg", ".png", ".webp"] }
      : { "video/*": [".mp4", ".avi", ".mov", ".mkv"] },
    maxFiles: 1,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Upload & Detect</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Upload vehicle images or videos for plate extraction</p>
      </div>

      {/* Tab */}
      <div className="flex gap-2">
        {(["image", "video"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setResults([]); setPreview(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? "bg-brand-600/20 text-brand-400 border border-brand-600/30" : "text-[var(--text-muted)] hover:text-white"}`}
          >
            {t === "image" ? <Image size={15} /> : <FileVideo size={15} />}
            {t === "image" ? "Image Upload" : "Video Upload"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drop Zone */}
        <div>
          <div
            {...getRootProps()}
            className={`glass-card rounded-xl border-2 border-dashed cursor-pointer transition-all p-8 text-center ${isDragActive ? "border-brand-400 bg-brand-600/10" : "border-[rgba(42,82,130,0.4)] hover:border-brand-500/50"}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              {loading ? (
                <Loader2 size={36} className="text-brand-400 animate-spin" />
              ) : (
                <CloudUpload size={36} className={isDragActive ? "text-brand-400" : "text-[var(--text-muted)]"} />
              )}
              <div>
                <p className="text-sm font-medium text-white">
                  {loading ? "Processing..." : isDragActive ? "Drop it here!" : `Drop ${tab === "image" ? "an image" : "a video"} here`}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {tab === "image" ? "JPG, PNG, WEBP supported" : "MP4, AVI, MOV — frame-by-frame detection"}
                </p>
              </div>
              {!loading && (
                <button className="btn-primary text-xs px-4 py-2 mt-2">Browse Files</button>
              )}
            </div>
          </div>

          {/* Image preview */}
          {preview && tab === "image" && (
            <div className="glass-card mt-4 overflow-hidden rounded-xl">
              <img src={preview} alt="Preview" className="w-full object-contain max-h-64" />
            </div>
          )}
        </div>

        {/* Results */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[rgba(42,82,130,0.2)] flex items-center gap-2">
            <Upload size={15} className="text-brand-400" />
            <span className="text-sm font-semibold text-white">Detection Results</span>
            {results.length > 0 && (
              <span className="ml-auto text-xs bg-brand-600/20 text-brand-400 px-2 py-0.5 rounded-full">{results.length} found</span>
            )}
          </div>
          <div className="overflow-y-auto max-h-80">
            {results.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-40 text-[var(--text-muted)] text-sm gap-2">
                <Upload size={28} className="opacity-30" />
                <span>Results will appear here</span>
              </div>
            )}
            {results.map((r, i) => (
              <div key={i} className="px-5 py-4 border-b border-[rgba(42,82,130,0.1)] flex items-start justify-between gap-4 hover:bg-brand-600/5 transition-colors">
                <div className="space-y-1.5">
                  <div className="plate-badge">{r.formatted_plate || r.plate_number}</div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium flex items-center gap-1 ${r.is_valid_format === "true" ? "text-accent-green" : "text-accent-amber"}`}>
                      {r.is_valid_format === "true" ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                      {r.is_valid_format === "true" ? "Valid Indian Plate" : "Format Unknown"}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">{new Date(r.detected_at).toLocaleString("en-IN")}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-white">{(r.confidence * 100).toFixed(0)}%</div>
                  <div className="text-xs text-[var(--text-muted)]">confidence</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
