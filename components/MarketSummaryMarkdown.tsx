import React from "react";
/** Small inert Markdown subset: no HTML, images, embeds, or executable protocols. */
export default function MarketSummaryMarkdown({ text }: { text: string }) {
  const inline = (line: string) =>
    line.split(/(\[[^\]\n]+\]\([^\s)]+\)|\*\*[^*\n]+\*\*)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      const match = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      if (match) {
        try {
          const u = new URL(match[2]);
          if (u.protocol === "https:" && !u.username && !u.password)
            return (
              <a
                key={i}
                href={u.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {match[1]}
              </a>
            );
        } catch {}
        return <span key={i}>{match[1]}</span>;
      }
      return part;
    });
  return (
    <div>
      {text.split(/\n\s*\n/).map((block, i) => {
        const lines = block.split("\n");
        return (
          <section key={i}>
            {lines.map((line, j) => {
              const heading = /^#{1,6}\s+(.+)$/.exec(line);
              if (heading) return <h3 key={j}>{inline(heading[1])}</h3>;
              if (/^\s*[-*]\s+/.test(line))
                return (
                  <ul key={j}>
                    <li>{inline(line.replace(/^\s*[-*]\s+/, ""))}</li>
                  </ul>
                );
              return <p key={j}>{inline(line)}</p>;
            })}
          </section>
        );
      })}
    </div>
  );
}
