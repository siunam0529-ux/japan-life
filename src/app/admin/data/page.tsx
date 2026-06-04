import { redirect } from "next/navigation";

export default function AdminDataRedirectPage() {
  redirect("/admin/content#content-management");
}
