/** A closed text projection, never an HTML/JS or provider-component interpreter. */
export type ReportBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "metric"; label: string; value: string; change: string };
export function reportContent(text: string): ReportBlock[] {
  const blocks: ReportBlock[] = [];
  const paragraph = (value: string) => {
    for (const part of value.split(/\n\s*\n/)) {
      if (part.trim()) blocks.push({ kind: "paragraph", text: part.trim() });
    }
  };
  // Only standalone directives are structural; ordinary narrative is unchanged.
  const directive = /^\s*::([a-zA-Z][\w-]*)\{([^\n]*)\}\s*$/gm;
  let cursor = 0;
  for (const match of text.matchAll(directive)) {
    paragraph(text.slice(cursor, match.index));
    const attributes: Record<string, string> = Object.create(null);
    const values: string[] = [];
    let duplicateKey = false;
    const remaining = match[2].replace(
      /([\w-]+)\s*=\s*"((?:\\.|[^"\\])*)"/g,
      (_, key: string, value: string) => {
        const decoded = value.replace(/\\(["\\])/g, "$1");
        if (Object.hasOwn(attributes, key)) duplicateKey = true;
        attributes[key] = decoded;
        values.push(decoded);
        return "";
      },
    );
    if (
      match[1] === "metric" &&
      !duplicateKey &&
      attributes.label &&
      attributes.value &&
      !remaining.trim() &&
      Object.keys(attributes).every((key) =>
        ["label", "value", "change"].includes(key),
      )
    ) {
      blocks.push({
        kind: "metric",
        label: attributes.label,
        value: attributes.value,
        change: attributes.change ?? "",
      });
    } else {
      // Unrecognized directives remain readable data, not an executable widget.
      paragraph([...values, remaining.trim()].filter(Boolean).join(" · "));
    }
    cursor = match.index + match[0].length;
  }
  paragraph(text.slice(cursor));
  return blocks;
}
