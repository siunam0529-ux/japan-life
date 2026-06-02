import { NextResponse, type NextRequest } from "next/server";
import { adminErrorResponse, missingSupabaseAdminResponse } from "@/lib/supabaseAdmin";
import { supabase, supabaseAdmin, supabaseConfigError } from "@/lib/supabase";

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

async function requireUploadUser(request: NextRequest) {
  if (!supabase) return { error: supabaseConfigError || "Supabase public client is not configured.", status: 500, userId: "" };
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return { error: "请先登录后再上传图片。", status: 401, userId: "" };
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { error: error?.message || "登录已过期，请重新登录。", status: 401, userId: "" };
  return { error: "", status: 200, userId: data.user.id };
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) return missingSupabaseAdminResponse();
  const user = await requireUploadUser(request);
  if (user.error) return NextResponse.json({ error: user.error }, { status: user.status });

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

    const filePath = `${folder}/${user.userId}/${Date.now()}-${crypto.randomUUID()}.${getExtension(file)}`;
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
