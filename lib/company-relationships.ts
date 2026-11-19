export type CompanyRelationships = {
  ticker: string;
  root: string;
  truncated: boolean;
  nodes: { slug: string; displayName: string; type: string }[];
  edges: { source: string; target: string; type: string; direction: string }[];
};
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= 200;
export function companyRelationships(
  value: unknown,
): CompanyRelationships | null {
  if (
    !obj(value) ||
    !str(value.ticker) ||
    !str(value.root) ||
    value.depth !== 1 ||
    value.cap !== 30 ||
    typeof value.truncated !== "boolean" ||
    !Array.isArray(value.nodes) ||
    !Array.isArray(value.edges) ||
    value.nodes.length > 31 ||
    value.nodes.length < 1 ||
    value.edges.length > 300
  )
    return null;
  const nodes: CompanyRelationships["nodes"] = [];
  const ids = new Set<string>();
  for (const n of value.nodes) {
    if (
      !obj(n) ||
      !str(n.slug) ||
      !str(n.displayName) ||
      !str(n.type) ||
      ids.has(n.slug)
    )
      return null;
    ids.add(n.slug);
    nodes.push({ slug: n.slug, displayName: n.displayName, type: n.type });
  }
  if (!ids.has(value.root)) return null;
  const edges: CompanyRelationships["edges"] = [];
  for (const e of value.edges) {
    if (
      !obj(e) ||
      !str(e.source) ||
      !str(e.target) ||
      !str(e.type) ||
      !["DIRECTED", "BIDIRECTIONAL"].includes(String(e.direction)) ||
      !ids.has(e.source) ||
      !ids.has(e.target)
    )
      return null;
    edges.push({
      source: e.source,
      target: e.target,
      type: e.type,
      direction: String(e.direction),
    });
  }
  return {
    ticker: value.ticker,
    root: value.root,
    truncated: value.truncated,
    nodes,
    edges,
  };
}
