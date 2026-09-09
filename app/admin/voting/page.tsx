import type { Metadata } from "next";
import VotingAdmin from "@/components/voting/VotingAdmin";

export const metadata: Metadata = { title: "Ruang Panitia — Voting IMO 2026", robots: { index: false, follow: false } };
export default function VotingAdminPage() { return <VotingAdmin />; }
