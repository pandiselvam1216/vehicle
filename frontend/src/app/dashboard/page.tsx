"use client";
import { useEffect, useState } from "react";
import { getSummary, listDetections, getDailyTraffic } from "@/lib/api";
import CameraTile from "@/components/CameraTile";
import { useAuth } from "@/contexts/AuthContext";
import { Activity, Car, Camera, ShieldCheck, Clock, Scan } from "lucide-react";

const DEMO_CAMERAS = [
  { cameraId: "cam-01", label: "Gate 1 — Entry" },
  { cameraId: "cam-02", label: "Gate 2 — Exit" },
];

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [detections, setDetections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, d] = await Promise.all([getSummary(), listDetections({ limit: 15 })]);
        setSummary(s.data);
        setDetections(d.data.detections);
      } catch {}
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Live Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Real-time vehicle detection and monitoring</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-accent-green">
          <span className="status-dot online" />
          System Online
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total Detections" value={summary?.total_detections ?? "—"} color="bg-gradient-to-br from-brand-700 to-brand-500" />
        <StatCard icon={Car} label="Today's Traffic" value={summary?.today_detections ?? "—"} color="bg-gradient-to-br from-emerald-700 to-emerald-500" />
        <StatCard icon={ShieldCheck} label="Valid Plates" value={summary?.valid_plates ?? "—"} color="bg-gradient-to-br from-violet-700 to-violet-500" />
        <StatCard icon={Camera} label="Active Cameras" value={summary?.active_cameras ?? "—"} color="bg-gradient-to-br from-amber-700 to-amber-500" />
      </div>

      {/* Camera tiles */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Live Feeds</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_CAMERAS.map((cam) => (
            <CameraTile key={cam.cameraId} cameraId={cam.cameraId} label={cam.label} token={token} />
          ))}
        </div>
      </div>

      {/* Recent Detections Table */}
      <div className="glass-card">
        <div className="px-5 py-3.5 border-b border-[rgba(42,82,130,0.2)] flex items-center gap-2">
          <Scan size={16} className="text-brand-400" />
          <h2 className="text-sm font-semibold text-white">Recent Detections</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-[var(--text-muted)] text-sm">Loading...</div>
          ) : detections.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-[var(--text-muted)] text-sm">No detections yet — start a live feed or upload an image.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plate Number</th>
                  <th>Confidence</th>
                  <th>Camera</th>
                  <th>Source</th>
                  <th>Valid</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {detections.map((d) => (
                  <tr key={d.id}>
                    <td><span className="plate-badge">{d.plate_number}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="conf-bar-bg w-16">
                          <div className="conf-bar" style={{ width: `${Math.round(d.confidence * 100)}%` }} />
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">{(d.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="text-[var(--text-muted)]">{d.camera_id || "—"}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.source === "stream" ? "bg-brand-600/20 text-brand-400" : d.source === "video" ? "bg-violet-600/20 text-violet-400" : "bg-emerald-600/20 text-emerald-400"}`}>
                        {d.source}
                      </span>
                    </td>
                    <td>
                      <span className={`text-xs font-medium ${d.is_valid_format === "true" ? "text-accent-green" : "text-accent-amber"}`}>
                        {d.is_valid_format === "true" ? "✓ Valid" : "✗ Invalid"}
                      </span>
                    </td>
                    <td className="text-xs text-[var(--text-muted)]">
                      {d.detected_at ? new Date(d.detected_at).toLocaleString("en-IN") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
