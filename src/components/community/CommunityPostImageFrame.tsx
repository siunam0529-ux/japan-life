"use client";

import { useState } from "react";
import type { CommunityPostImage, CommunityPostType } from "@/lib/community/types";

const imageGradientMap: Record<string, string> = {
  "amber-pink": "bg-[linear-gradient(135deg,#fef3c7,#fce7f3,#dbeafe)]",
  "pink-blue": "bg-[linear-gradient(135deg,#fce7f3,#dbeafe,#ffffff)]",
  "rose-indigo": "bg-[linear-gradient(135deg,#ffe4e6,#e0e7ff,#ffffff)]",
  "sky-mint": "bg-[linear-gradient(135deg,#dbeafe,#ccfbf1,#ffffff)]",
  "teal-blue": "bg-[linear-gradient(135deg,#ccfbf1,#dbeafe,#ffffff)]",
  "violet-sky": "bg-[linear-gradient(135deg,#ede9fe,#e0f2fe,#ffffff)]",
};

export function getCommunityImageUrl(image: CommunityPostImage | undefined) {
  if (!image) return "";
  if (typeof image === "string") return image.startsWith("http") || image.startsWith("/") ? image : "";
  const url = typeof image.url === "string" ? image.url : "";
  return url.startsWith("http") || url.startsWith("/") ? url : "";
}

export function getCommunityImageAlt(image: CommunityPostImage | undefined, fallback = "") {
  if (!image || typeof image === "string") return fallback;
  return image.alt || fallback;
}

export function CommunityPostImageFrame({
  className = "",
  image,
  large = false,
  showAlt = false,
  type,
}: {
  className?: string;
  image?: CommunityPostImage;
  large?: boolean;
  showAlt?: boolean;
  type: CommunityPostType;
}) {
  const [failed, setFailed] = useState(false);
  const url = failed ? "" : getCommunityImageUrl(image);
  const baseClass = large ? "h-[268px] rounded-[26px]" : "h-full rounded-none";
  if (url) {
    return (
      <img
        alt={getCommunityImageAlt(image)}
        className={`${baseClass} ${className} w-full object-cover`}
        decoding="async"
        loading={large ? "eager" : "lazy"}
        onError={() => setFailed(true)}
        src={url}
      />
    );
  }

  const previewColor = typeof image === "object" && image && "previewColor" in image ? image.previewColor : getPreviewColor(type);
  const isTextCover = typeof image === "object" && image && "type" in image && image.type === "text-cover";
  const textCoverTitle = isTextCover ? image.title || image.alt : "";
  const textCoverBody = isTextCover ? image.coverText || "" : "";
  if (textCoverTitle || textCoverBody) {
    return (
      <div className={`${baseClass} ${className} ${imageGradientMap[previewColor] ?? getPlaceholderGradient(type)} relative flex w-full overflow-hidden p-4`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.72)_0_16%,transparent_17%),linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.40))]" />
        <div className="relative z-10 flex h-full w-full flex-col justify-center">
          {textCoverTitle ? <p className={`${large ? "line-clamp-3 text-[24px] leading-8" : "line-clamp-3 text-[18px] leading-6"} font-black text-[#061a3a] [overflow-wrap:anywhere]`}>{textCoverTitle}</p> : null}
          {textCoverBody ? <p className={`${large ? "mt-3 line-clamp-5 text-[15px] leading-6" : "mt-2 line-clamp-4 text-[12px] leading-[18px]"} font-bold text-[#263b59] [overflow-wrap:anywhere]`}>{textCoverBody}</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClass} ${className} ${imageGradientMap[previewColor] ?? getPlaceholderGradient(type)} flex w-full items-end overflow-hidden p-4`}>
      {showAlt && large ? <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-[#2563EB] ring-1 ring-blue-100">{getCommunityImageAlt(image, "Japan Life")}</span> : null}
    </div>
  );
}

export function getPreviewColor(type: CommunityPostType) {
  if (type === "share") return "pink-blue";
  if (type === "discount") return "amber-pink";
  if (type === "secondhand") return "sky-mint";
  if (type === "buddy") return "violet-sky";
  if (type === "friend") return "rose-indigo";
  return "teal-blue";
}

export function getPlaceholderGradient(type: CommunityPostType) {
  if (type === "share") return "bg-[linear-gradient(135deg,#dbeafe,#fce7f3,#ffffff)]";
  if (type === "discount") return "bg-[linear-gradient(135deg,#fef3c7,#fee2e2,#ffffff)]";
  if (type === "secondhand") return "bg-[linear-gradient(135deg,#d1fae5,#dbeafe,#ffffff)]";
  if (type === "buddy") return "bg-[linear-gradient(135deg,#ede9fe,#dbeafe,#ffffff)]";
  if (type === "friend") return "bg-[linear-gradient(135deg,#ffe4e6,#e0e7ff,#ffffff)]";
  return "bg-[linear-gradient(135deg,#e0f2fe,#fce7f3,#ffffff)]";
}
