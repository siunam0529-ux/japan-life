import { NextResponse, type NextRequest } from "next/server";
import { adminErrorResponse, missingSupabaseAdminResponse } from "@/lib/supabaseAdmin";
import { supabaseAdmin } from "@/lib/supabase";

const bucketName = "public-images";
const maxImageSize = 5 * 1024 * 1024;
const allowedTypes = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);

function getExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === "image/gif") return "gif";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function cleanFolder(value: FormDataEntryValue | null) {
  return typeof value === "string" && /^[a-z0-9-]+$/i.test(value) ? value : "uploads";
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) return missingSupabaseAdminResponse();

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = cleanFolder(formData.get("folder"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing image file." }, { status: 400 });
    }
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, WebP or GIF images are supported." }, { status: 400 });
    }
    if (file.size > maxImageSize) {
      return NextResponse.json({ error: "Image size must be 5MB or less." }, { status: 400 });
    }

    const filePath = `${folder}/${Date.now()}-${crypto.randomUUID()}.${getExtension(file)}`;
    const { error } = await supabaseAdmin.storage.from(bucketName).upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
    if (error) return adminErrorResponse(error);

    const { data } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath);
    return NextResponse.json({ path: filePath, publicUrl: data.publicUrl });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
