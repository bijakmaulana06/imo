import type { Metadata } from "next";
import VoteMonitor from "@/components/voting/VoteMonitor";

export const metadata: Metadata = {
  title: "Ruang Pantau — Pemilihan Ketua Angkatan | IMO",
  description: "Ruang pemantauan perolehan suara dan partisipasi pemilihan ketua angkatan untuk panitia IMO.",
  robots: { index: false, follow: false },
};

export default function VotingMonitorPage() {
  return <VoteMonitor />;
}

