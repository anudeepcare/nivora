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
