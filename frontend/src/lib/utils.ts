import type { FilterCategory } from "@/lib/types";

export function getCategoryKey(category: unknown): string {
  if (!category) return "other";
  if (typeof category === "object") {
    const key = Object.keys(category as object)[0]?.toLowerCase() ?? "other";
    if (["hackathon", "workshop"].includes(key)) return "other";
    return key;
  }
  return String(category).toLowerCase();
}

export function filterEvents(
  events: any[],
  category: FilterCategory,
  query: string = ""
): any[] {
  let result =
    category === "all"
      ? events
      : events.filter((e) => getCategoryKey(e.category) === category);

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (e) =>
        (e.name  ?? e.title    ?? "").toLowerCase().includes(q) ||
        (e.location ?? "").toLowerCase().includes(q)
    );
  }
  return result;
}

export function formatPrice(price: string, currency: "ETH" | "SOL"): string {
  return `${price} ${currency}`;
}

export const FILTER_LABELS: Record<FilterCategory, string> = {
  all:        "All",
  music:      "Music",
  conference: "Conference",
  sports:     "Sports",
  art:        "Art",
  other:      "Other",
};