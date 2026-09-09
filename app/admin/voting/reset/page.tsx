import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireVotingAdmin } from "@/lib/voting/server";
import VotingReset from "@/components/voting/VotingReset";

export const metadata: Metadata = { title: "Reset Voting — Ruang Panitia", robots: { index: false, follow: false } };
export default async function ResetVotingPage() {
  try { await requireVotingAdmin(); } catch { redirect("/admin/voting"); }
  return <VotingReset />;
}
