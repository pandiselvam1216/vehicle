"use client";
import { useEffect, useState } from "react";
import { listCameras } from "@/lib/api";
import { Camera, Wifi, WifiOff } from "lucide-react";

export default function CamerasPage() {
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCameras().then((r) => { setCameras(r.data.cameras); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Camera Management</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Registered camera sources</p>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[rgba(42,82,130,0.2)] flex items-center gap-2">
          <Camera size={15} className="text-brand-400" />
          <span className="text-sm font-semibold text-white">All Cameras</span>
          <span className="ml-auto text-xs bg-brand-600/20 text-brand-400 px-2 py-0.5 rounded-full">{cameras.length} registered</span>
        </div>
        {loading ? (
          <div className="flex h-32 items-center justify-center text-[var(--text-muted)] text-sm">Loading...</div>
        ) : cameras.length === 0 ? (
          <div className="flex flex-col h-40 items-center justify-center text-[var(--text-muted)] text-sm gap-2">
            <Camera size={28} className="opacity-30" />
            <span>No cameras registered. Add cameras via the API.</span>
            <code className="text-xs bg-dark-700 px-3 py-1 rounded mt-1 text-brand-400">POST /api/v1/cameras</code>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Camera ID</th><th>Name</th><th>Location</th><th>Status</th><th>RTSP</th></tr>
            </thead>
            <tbody>
              {cameras.map((c) => (
                <tr key={c.id}>
                  <td><span className="font-mono text-xs text-brand-400">{c.camera_id}</span></td>
                  <td className="font-medium text-white">{c.name}</td>
                  <td className="text-[var(--text-muted)]">{c.location || "—"}</td>
                  <td>
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${c.is_active ? "text-accent-green" : "text-accent-red"}`}>
                      {c.is_active ? <Wifi size={12} /> : <WifiOff size={12} />}
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="text-xs text-[var(--text-muted)] max-w-xs truncate">{c.rtsp_url || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
