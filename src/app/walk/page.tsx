import type { Metadata } from "next";
import WalkClientPage from "@/app/walk/WalkClientPage";

export const metadata: Metadata = {
  title: "随机散步｜Japan Life",
  description: "根据天气、时间和心情，随机推荐东京适合散步的地方。",
};

export default function WalkPage() {
  return <WalkClientPage />;
}
