import { tokyoStationRent2025, type LayoutType } from "@/data/tokyoStationRent2025";

export const layoutMultiplier: Record<LayoutType, number> = {
  "1R": 0.92,
  "1K": 1.0,
  "1DK": 1.15,
  "1LDK": 1.65,
  "2K": 1.25,
  "2DK": 1.45,
  "2LDK": 2.25,
  "3LDK": 2.85,
};

export const standardSize: Record<LayoutType, number> = {
  "1R": 20,
  "1K": 25,
  "1DK": 30,
  "1LDK": 40,
  "2K": 35,
  "2DK": 45,
  "2LDK": 55,
  "3LDK": 70,
};

export const staticRentReferenceNotice =
  "本结果基于东京热门车站公开租金相场整理的静态参考估算，仅供参考，并非正式不动产估价。实际租金会因楼龄、楼层、朝向、管理费、设备、契约条件、市场变化等因素而不同。";

export const rentEstimateDisclaimer =
  "本结果基于东京热门车站公开租金相场整理的参考估算，并非正式不动产估价。实际租金会因楼龄、楼层、朝向、管理费、设备、契约条件、市场变化等因素而不同。";

export function getWalkMultiplier(minutes: number) {
  if (minutes <= 3) return 1.12;
  if (minutes <= 5) return 1.08;
  if (minutes <= 10) return 1.0;
  if (minutes <= 15) return 0.93;
  if (minutes <= 20) return 0.88;
  return 0.82;
}

export function getAgeMultiplier(age: number) {
  if (age <= 3) return 1.15;
  if (age <= 10) return 1.08;
  if (age <= 20) return 1.0;
  if (age <= 30) return 0.9;
  if (age <= 40) return 0.82;
  return 0.75;
}

export function getFloorMultiplier(floor: number) {
  if (floor >= 20) return 1.12;
  if (floor >= 10) return 1.08;
  if (floor >= 3) return 1.03;
  if (floor === 1) return 0.95;
  return 1.0;
}

export function estimateRentByStation({
  stationName,
  layout,
  size,
  walkMinutes,
  buildingAge,
  floor,
}: {
  stationName: string;
  layout: LayoutType;
  size: number;
  walkMinutes: number;
  buildingAge: number;
  floor: number;
}) {
  const station = tokyoStationRent2025.find((item) => item.station === stationName);
  if (!station) return null;

  return estimateRentFromStationData({
    buildingAge,
    floor,
    layout,
    size,
    station,
    walkMinutes,
  });
}

export function estimateRentFromStationData({
  station,
  layout,
  size,
  walkMinutes,
  buildingAge,
  floor,
}: {
  station: (typeof tokyoStationRent2025)[number];
  layout: LayoutType;
  size: number;
  walkMinutes: number;
  buildingAge: number;
  floor: number;
}) {
  const base = station.base1K;
  const layoutRate = layoutMultiplier[layout];
  const baseSize = standardSize[layout];
  const sizeRate = 1 + ((size - baseSize) / baseSize) * 0.45;
  const walkRate = getWalkMultiplier(walkMinutes);
  const ageRate = getAgeMultiplier(buildingAge);
  const floorRate = getFloorMultiplier(floor);
  const estimated = base * layoutRate * sizeRate * walkRate * ageRate * floorRate;

  return {
    station,
    estimatedRent: Math.round(estimated / 1000) * 1000,
    breakdown: {
      base,
      layoutRate,
      sizeRate,
      walkRate,
      ageRate,
      floorRate,
    },
  };
}
