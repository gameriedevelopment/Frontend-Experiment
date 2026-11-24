/** The platforms players and communities pick from across Gamerie. */
export const PLATFORMS = ["PC", "PlayStation", "Xbox", "Nintendo Switch", "Mobile"];

const ADAPTERS: Record<string, string> = { bgmi: "BGMI", "ea-fc": "EA SPORTS FC", "mobile-legends": "Mobile Legends" };
export const adapterLabel = (key: string) => ADAPTERS[key] ?? key;

/** Games created without a cover get the API's placeholder, which reads better as no cover. */
export const coverOf = (url: string | null | undefined) => (url && !url.includes("placehold.co") ? url : null);
