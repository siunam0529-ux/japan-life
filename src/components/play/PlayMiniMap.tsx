"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { PlayDestination } from "@/lib/play/types";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function PlayMiniMap({ destination }: { destination: PlayDestination }) {
  const position: [number, number] = [destination.latitude, destination.longitude];

  return (
    <div className="overflow-hidden rounded-[24px] border border-emerald-100 bg-white shadow-[0_12px_30px_rgba(22,101,52,0.08)]">
      <MapContainer attributionControl center={position} className="h-[220px] w-full" dragging keyboard scrollWheelZoom={false} zoom={12} zoomControl={false}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={position}>
          <Popup>
            <div className="text-sm font-bold">
              <p>{destination.name}</p>
              <p className="text-xs text-slate-500">
                {destination.area} · {destination.prefecture}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
