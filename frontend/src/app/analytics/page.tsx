"use client";
import { useEffect, useState } from "react";
import { getDailyTraffic, getTopPlates, getSummary, getByCamera } from "@/lib/api";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { BarChart3, TrendingUp, Car } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const chartDefaults = {
  responsive: true,
  plugins: {
    legend: { labels: { color: "#6b8aad", font: { size: 11 } } },
    tooltip: { backgroundColor: "#0d1520", borderColor: "rgba(42,82,130,0.4)", borderWidth: 1, titleColor: "#e2eeff", bodyColor: "#6b8aad" },
  },
  scales: {
    x: { ticks: { color: "#6b8aad", font: { size: 10 } }, grid: { color: "rgba(42,82,130,0.1)" } },
    y: { ticks: { color: "#6b8aad", font: { size: 10 } }, grid: { color: "rgba(42,82,130,0.1)" } },
  },
};

export default function AnalyticsPage() {
  const [traffic, setTraffic] = useState<any>(null);
  const [topPlates, setTopPlates] = useState<any>(null);
  const [cameras, setCameras] = useState<any>(null);

  useEffect(() => {
    Promise.all([getDailyTraffic(14), getTopPlates(10), getByCamera()]).then(([t, p, c]) => {
      setTraffic(t.data);
      setTopPlates(p.data);
      setCameras(c.data);
    }).catch(() => {});
  }, []);

  const trafficData = traffic ? {
    labels: traffic.data.map((d: any) => d.date),
    datasets: [{
      label: "Detections",
      data: traffic.data.map((d: any) => d.count),
      borderColor: "#2ba3f5",
      backgroundColor: "rgba(43,163,245,0.08)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "#2ba3f5",
      pointRadius: 4,
    }],
  } : null;

  const topPlatesData = topPlates ? {
    labels: topPlates.data.map((d: any) => d.plate),
    datasets: [{
      label: "Count",
      data: topPlates.data.map((d: any) => d.count),
      backgroundColor: "rgba(43,163,245,0.6)",
      borderColor: "#2ba3f5",
      borderWidth: 1,
      borderRadius: 4,
    }],
  } : null;

  const cameraData = cameras ? {
    labels: cameras.data.map((d: any) => d.camera_id),
    datasets: [{
      data: cameras.data.map((d: any) => d.count),
      backgroundColor: ["#2ba3f5", "#00e676", "#ffab40", "#e040fb", "#ff5252", "#18ffff"],
      borderWidth: 0,
    }],
  } : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">Traffic patterns, frequency analysis, and camera stats</p>
      </div>

      {/* Daily Traffic */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={16} className="text-brand-400" />
          <h2 className="text-sm font-semibold text-white">Daily Traffic (14 days)</h2>
        </div>
        <div className="h-52">
          {trafficData ? <Line data={trafficData} options={chartDefaults as any} /> : <div className="flex h-full items-center justify-center text-[var(--text-muted)] text-sm">Loading...</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Plates */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Car size={16} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-white">Top 10 Most Detected Plates</h2>
          </div>
          <div className="h-52">
            {topPlatesData ? <Bar data={topPlatesData} options={chartDefaults as any} /> : <div className="flex h-full items-center justify-center text-[var(--text-muted)] text-sm">Loading...</div>}
          </div>
        </div>

        {/* By Camera */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={16} className="text-brand-400" />
            <h2 className="text-sm font-semibold text-white">Detections by Camera</h2>
          </div>
          <div className="h-52 flex items-center justify-center">
            {cameraData ? <Doughnut data={cameraData} options={{ responsive: true, plugins: { legend: { position: "right", labels: { color: "#6b8aad", font: { size: 11 }, padding: 12 } }, tooltip: { backgroundColor: "#0d1520", borderColor: "rgba(42,82,130,0.4)", borderWidth: 1, titleColor: "#e2eeff", bodyColor: "#6b8aad" } } }} /> : <div className="text-[var(--text-muted)] text-sm">Loading...</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
