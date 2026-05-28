export const tokyoWardBounds = [
  ward("千代田区", 35.67, 35.705, 139.738, 139.782),
  ward("中央区", 35.646, 35.695, 139.755, 139.805),
  ward("港区", 35.62, 35.685, 139.708, 139.78),
  ward("新宿区", 35.67, 35.73, 139.675, 139.745),
  ward("文京区", 35.695, 35.735, 139.735, 139.78),
  ward("台東区", 35.695, 35.735, 139.765, 139.805),
  ward("墨田区", 35.68, 35.735, 139.785, 139.835),
  ward("江東区", 35.61, 35.705, 139.775, 139.85),
  ward("品川区", 35.585, 35.64, 139.705, 139.76),
  ward("目黒区", 35.61, 35.665, 139.665, 139.72),
  ward("大田区", 35.52, 35.615, 139.66, 139.8),
  ward("世田谷区", 35.61, 35.69, 139.58, 139.69),
  ward("渋谷区", 35.65, 35.7, 139.675, 139.725),
  ward("中野区", 35.68, 35.735, 139.625, 139.69),
  ward("杉並区", 35.67, 35.73, 139.585, 139.665),
  ward("豊島区", 35.71, 35.75, 139.69, 139.755),
  ward("北区", 35.735, 35.795, 139.7, 139.765),
  ward("荒川区", 35.72, 35.755, 139.76, 139.805),
  ward("板橋区", 35.735, 35.795, 139.64, 139.735),
  ward("練馬区", 35.72, 35.785, 139.56, 139.685),
  ward("足立区", 35.735, 35.82, 139.74, 139.86),
  ward("葛飾区", 35.725, 35.79, 139.815, 139.89),
  ward("江戸川区", 35.63, 35.76, 139.835, 139.92),
] as const;

export const tokyoWardNames = tokyoWardBounds.map((item) => item.name);

export function getTokyoWardByCoordinate(latitude: number, longitude: number) {
  return tokyoWardBounds.find((item) => latitude >= item.minLat && latitude <= item.maxLat && longitude >= item.minLng && longitude <= item.maxLng)?.name ?? null;
}

function ward(name: string, minLat: number, maxLat: number, minLng: number, maxLng: number) {
  return { maxLat, maxLng, minLat, minLng, name };
}
