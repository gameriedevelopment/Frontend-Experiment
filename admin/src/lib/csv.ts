type Cell = string | number | boolean | null | undefined;

const escape = (value: Cell) => {
  const raw = value == null ? "" : String(value);
  const text = typeof value === "string" && /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Downloads rows as a CSV file named after the view and today's date. */
export function downloadCsv(name: string, header: string[], rows: Cell[][]) {
  const body = [header, ...rows].map((row) => row.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: `${name}-${new Date().toISOString().slice(0, 10)}.csv` });
  link.click();
  URL.revokeObjectURL(url);
}
