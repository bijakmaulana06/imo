export type Candidate = {
  id: string;
  electionId: string;
  number: number;
  name: string;
  tagline: string;
  vision: string;
  mission: string[];
  photoUrl: string | null;
  accent: string;
};

export type Election = {
  id: string;
  title: string;
  year: string;
  status: "draft" | "open" | "closed";
  opensAt: string | null;
  closesAt: string | null;
};

export type ElectionSnapshot = {
  configured: boolean;
  election: Election | null;
  candidates: Candidate[];
  message?: string;
};

export type VoterSession = {
  verified: boolean;
  electionId?: string;
  nimMasked?: string;
  voterName?: string;
  expiresAt?: string;
  hasVoted?: boolean;
  receipt?: string;
};

export type MonitorSnapshot = {
  election: Election | null;
  candidates: Candidate[];
  eligibleVoters: number;
  totalVotes: number;
  results: { candidateId: string; votes: number }[];
  timeline: { time: string; votes: number }[];
  updatedAt: string;
};
