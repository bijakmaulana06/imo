import type { Metadata } from "next";
import VotingExperience from "@/components/voting/VotingExperience";

export const metadata: Metadata = {
  title: "The Next Chapter — Pemilihan Ketua Angkatan | IMO 2026",
  description: "Kenali calon pemimpin angkatanmu. Satu suara untuk perjalanan kita berikutnya.",
};

export default function VotingPage() {
  return <VotingExperience />;
}
