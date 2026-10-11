/** A deck's address on the public Study Cards pages: "System Design" ->
 *  "system-design" (/cards/system-design). Shared with server/publicCards.ts. */
export const slugOf = (name: string): string =>
  name.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
