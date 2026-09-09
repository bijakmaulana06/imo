import type { ElectionInput, CandidateInput } from "./admin-input.mjs";

export type AdminElection = ElectionInput & { id: string; status: "draft" | "open" | "closed"; is_current: boolean };
export type AdminCandidate = CandidateInput & { id: string; photoUrl: string | null };
export type AdminSnapshot = {
  elections: AdminElection[];
  election: AdminElection | null;
  candidates: AdminCandidate[];
  eligibleVoters: number;
  totalVotes: number;
};
