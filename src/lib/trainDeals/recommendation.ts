import type { TrainDealCalculatorState } from "@/lib/trainDeals/types";

export function getTrainDealAdvice({ airport, mainRail, multiSpot, rideCount, suburban }: TrainDealCalculatorState) {
  if (airport) {
    return "如果今天去机场，机场交通通常规则不同。先确认出发站、到达航站楼和行李情况，再看成田或羽田相关票券。";
  }

  if (suburban) {
    return "如果今天去关东近郊，可以考虑近郊周游票或私铁フリーパス；但请先确认目的地是否在适用范围内。";
  }

  if (rideCount === "1〜2 次") {
    return "如果只是往返一次或只坐 1〜2 次，普通 IC 卡通常更简单。优惠票未必一定划算。";
  }

  if (mainRail === "Metro") {
    return multiSpot
      ? "如果今天主要坐 Metro 且会移动 4 次以上，可以考虑 Metro 24小时券或地下铁相关一日券。"
      : "如果今天主要坐 Metro，移动次数较多时可以看看 Metro 一日券；路线少的话 IC 卡也很省心。";
  }

  if (mainRail === "都营") {
    return "如果今天主要坐都营地下铁或都营巴士，可以考虑都营一日乘车券，购买前先确认适用范围。";
  }

  if (mainRail === "JR" && rideCount === "5 次以上") {
    return "如果今天主要坐 JR 且在东京 23 区内多次移动，可以看看 JR 都区内相关票种。";
  }

  if (mainRail === "私铁" && multiSpot) {
    return "如果今天主要坐同一家私铁且会去多个站，可以看看该公司的ワンデーパス或フリーきっぷ。";
  }

  if (mainRail === "混坐") {
    return "如果 JR、Metro、都营和私铁混坐很多，一日券未必一定划算，建议先确认路线和铁路公司。";
  }

  if (multiSpot) {
    return "如果今天要去多个景点，可以先看覆盖范围较广的一日券；不要只看票名，重点确认路线是否真的覆盖。";
  }

  return "如果移动次数较多，可以比较一日券和 IC 卡；本工具只做方向判断，不做精确票价计算。";
}

export function getTodayTrainDealTip() {
  const hour = new Date().getHours();
  if (hour < 10) return "早上出门前先想清楚今天会不会多次换乘，一日券适合路线比较集中的日子。";
  if (hour < 15) return "中午以后如果还要去两三个地方，可以再检查一日券是否覆盖今天的主要路线。";
  if (hour < 22) return "晚上临时加行程时，不一定需要买优惠票；少量移动用 IC 卡通常更简单。";
  return "深夜交通选择会变少，优惠票不是重点，先确认末班车和回家路线。";
}
