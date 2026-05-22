import { NextResponse, type NextRequest } from "next/server";
import { adminErrorResponse, invalidAdminResponse, missingSupabaseResponse, verifyAdminPassword } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";

const bucketName = "public-images";
const maxImageSize = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function getPassword(request: NextRequest) {
  return request.headers.get("x-admin-password") ?? "";
}

function getExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(getPassword(request))) return invalidAdminResponse();
  if (!supabase) return missingSupabaseResponse();

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image file." }, { status: 400 });
    }
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, WebP or GIF images are supported." }, { status: 400 });
    }
    if (file.size > maxImageSize) {
      return NextResponse.json({ error: "Image size must be 5MB or less." }, { status: 400 });
    }

    const extension = getExtension(file);
    const filePath = `admin/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

    if (error) return adminErrorResponse(error);

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return NextResponse.json({ path: filePath, publicUrl: data.publicUrl });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
