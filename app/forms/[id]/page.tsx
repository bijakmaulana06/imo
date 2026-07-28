import { redirect } from "next/navigation";

export default async function FormsIdRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/documents/${id}`);
}
