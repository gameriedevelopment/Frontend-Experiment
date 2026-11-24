const FORMAT: Record<string, string> = {
  single_elimination: "Single elimination",
  double_elimination: "Double elimination",
  round_robin: "Round robin",
  single: "Single round robin",
  double: "Double round robin",
};

export const formatLabel = (format: string | null | undefined) => (format ? (FORMAT[format] ?? format.replace(/_/g, " ")) : "—");

export const money = (prize: { total: number; currency: string } | null | undefined) =>
  prize && prize.total > 0 ? new Intl.NumberFormat("en", { style: "currency", currency: prize.currency || "USD", maximumFractionDigits: 0 }).format(prize.total) : null;
