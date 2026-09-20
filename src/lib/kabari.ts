export const SCRAP_CATEGORIES = [
  "Iron",
  "Steel",
  "Copper",
  "Aluminium",
  "Brass",
  "Plastic",
  "Paper",
  "Cardboard",
  "Electronics",
  "Appliances",
  "Batteries",
  "Glass",
] as const;

export const ISLAMABAD_SECTORS = [
  "F-6",
  "F-7",
  "F-8",
  "F-10",
  "F-11",
  "G-6",
  "G-7",
  "G-8",
  "G-9",
  "G-10",
  "G-11",
  "G-13",
  "H-8",
  "H-9",
  "I-8",
  "I-9",
  "I-10",
  "E-11",
  "Bahria Town",
  "DHA",
] as const;

export const PICKUP_SLOTS = [
  { value: "morning", label: "Morning (9am – 12pm)" },
  { value: "afternoon", label: "Afternoon (12pm – 4pm)" },
  { value: "evening", label: "Evening (4pm – 8pm)" },
] as const;

export type RequestStatus =
  | "received"
  | "accepted"
  | "scheduled"
  | "dispatched"
  | "collected"
  | "weighed"
  | "paid"
  | "completed"
  | "rejected";

export const STATUS_FLOW: RequestStatus[] = [
  "received",
  "accepted",
  "scheduled",
  "dispatched",
  "collected",
  "weighed",
  "paid",
  "completed",
];

export const STATUS_LABELS: Record<RequestStatus, string> = {
  received: "Request received",
  accepted: "Accepted",
  scheduled: "Pickup scheduled",
  dispatched: "Team dispatched",
  collected: "Scrap collected",
  weighed: "Weighed",
  paid: "Payment completed",
  completed: "Completed",
  rejected: "Rejected",
};

export const STATUS_SHORT: Record<RequestStatus, string> = {
  received: "Received",
  accepted: "Accepted",
  scheduled: "Scheduled",
  dispatched: "Dispatched",
  collected: "Collected",
  weighed: "Weighed",
  paid: "Paid",
  completed: "Done",
  rejected: "Rejected",
};

export const TEAM_MEMBERS = ["Team A", "Team B", "Team C"] as const;

export function statusIndex(status: string) {
  return STATUS_FLOW.indexOf(status as RequestStatus);
}

export function nextStatus(status: string): RequestStatus | null {
  const i = statusIndex(status);
  if (i < 0 || i >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[i + 1] ?? null;
}

export function formatPkr(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "—";
  return `Rs. ${Number(amount).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export function formatKg(weight: number | null | undefined) {
  if (weight === null || weight === undefined) return "—";
  return `${Number(weight)} kg`;
}

export function categoryTag(categories: string[] | null) {
  const first = categories?.[0] ?? "SC";
  return first.slice(0, 2).toUpperCase();
}
