export type HandbookChapter = {
  id: number;
  title: string;
  body: string;
  reference: boolean;
};
/** Read headings outside code fences; the cover page is metadata, not a chapter. */
export function handbookChapters(content: string): HandbookChapter[] {
  const chapters: HandbookChapter[] = [];
  let fenced = false;
  for (const line of content.replace(/\r\n/g, "\n").split("\n")) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const heading = !fenced && /^## (.+)$/.exec(line);
    if (heading)
      chapters.push({
        id: chapters.length,
        title: heading[1],
        body: "",
        reference: heading[1].startsWith("Reference:"),
      });
    else if (chapters.length) chapters[chapters.length - 1].body += line + "\n";
  }
  return chapters.filter((c) => c.body.trim());
}
export function findHandbookChapters(
  chapters: HandbookChapter[],
  query: string,
  references = false,
) {
  const q = query.trim().toLowerCase();
  return chapters.filter(
    (c) =>
      (references || !c.reference) &&
      (c.title + "\n" + c.body).toLowerCase().includes(q),
  );
}

export type HandbookBlock =
  | { kind: "paragraph" | "heading" | "code"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "table"; header: string[]; rows: string[][] };
/** Small, safe Markdown subset. HTML remains text and is escaped by React. */
export function handbookBlocks(content: string): HandbookBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: HandbookBlock[] = [];
  const cells = (line: string) =>
    line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((x) => x.trim());
  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^\s*```/.test(line)) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i]))
        code.push(lines[i++]);
      i++;
      blocks.push({ kind: "code", text: code.join("\n") });
      continue;
    }
    if (/^#{3,6} /.test(line)) {
      blocks.push({ kind: "heading", text: line.replace(/^#{3,6} /, "") });
      i++;
      continue;
    }
    if (line.includes("|") && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] ?? "")) {
      const header = cells(line),
        rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(cells(lines[i++]));
      }
      blocks.push({ kind: "table", header, rows });
      continue;
    }
    if (/^\s*(?:[-*]|\d+\.) /.test(line)) {
      const ordered = /^\s*\d+\./.test(line),
        items: string[] = [];
      while (i < lines.length && /^\s*(?:[-*]|\d+\.) /.test(lines[i]))
        items.push(lines[i++].replace(/^\s*(?:[-*]|\d+\.) /, ""));
      blocks.push({ kind: "list", ordered, items });
      continue;
    }
    const paragraph = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*(?:#{3,6} |```|[-*] |\d+\. )/.test(lines[i]) &&
      !(lines[i].includes("|") && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1] ?? ""))
    )
      paragraph.push(lines[i++]);
    blocks.push({ kind: "paragraph", text: paragraph.join("\n") });
  }
  return blocks;
}
