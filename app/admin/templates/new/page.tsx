import { redirect } from "next/navigation";

export default function AdminTemplatesNewRedirect() {
  redirect("/admin/document-templates/create");
}
