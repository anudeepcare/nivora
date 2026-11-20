import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(`components/${file}`, "utf8");
test("owner manual has linked desktop chapters and a compact responsive jump control", () => {
  const view = read("OwnerHandbook.tsx");
  assert.match(
    view,
    /<nav[^>]*className=\{styles.topics\}[^>]*aria-label="Handbook contents"/,
  );
  assert.match(view, /href=\{chapterLocation\(chapter.id\)\}/);
  assert.match(
    view,
    /aria-current=\{\s*active\?\.id === chapter.id \? "location" : undefined\s*\}/,
  );
  assert.match(view, /className=\{styles.chapterControl\}/);
  assert.match(view, /<input\s+type="search"/);
  const css = read("OwnerHandbook.module.css");
  assert.match(
    css,
    /\.layout\s*\{[^}]*grid-template-columns:\s*minmax\([^)]*\) minmax\(0, 1fr\)/,
  );
  assert.match(
    css,
    /@media \(max-width: 800px\)[\s\S]*?\.topics\s*\{[^}]*display: none/,
  );
  assert.match(
    css,
    /@media \(max-width: 800px\)[\s\S]*?\.chapterControl\s*\{[^}]*display: (?:block|grid)/,
  );
});

test("document text is open in reading order, and references and download remain opt-in", () => {
  const view = read("OwnerHandbook.tsx");
  assert.doesNotMatch(view, /<details/);
  assert.match(
    view,
    /<article[^>]*[\s\S]*?<h3[^>]*[\s\S]*?<div className=\{styles.body\}[^>]*>/,
  );
  for (const marker of [
    "handbookBlocks",
    "<ol",
    "<table",
    "<pre>",
    "Technical reference",
    "onClick={download}",
  ])
    assert.ok(view.includes(marker), marker);
});

test("bookmarked chapters open the existing owner-gated panel, with browser history and chapter focus", () => {
  const view = read("OwnerHandbook.tsx");
  assert.match(view, /function handbookChapterFromHash/);
  assert.match(view, /window\.history\.pushState/);
  assert.match(view, /addEventListener\("hashchange"/);
  assert.match(view, /readerHeading.current.focus/);
  assert.match(view, /id=\{chapterLocation\(active.id\).slice\(1\)\}/);
  const owner = read("OwnerAccess.tsx");
  assert.match(
    owner,
    /if \(!access.owner\) return;[\s\S]*?handbookChapterFromHash\(window.location.hash\)[\s\S]*?setPanel\("handbook"\)/,
  );
  assert.match(owner, /if \(!access.owner\)\s*return \(/);
  assert.match(owner, /panel === "handbook"[\s\S]*?<OwnerHandbook/);
  assert.match(view, /api<\{ content: string \}>\("owner\/handbook"/);
});

test("real manual render opens full chapter, changes hash and restores reference bookmarks", async () => {
  const React = await import("react");
  const jsx = await import("react/jsx-runtime");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const ts = (await import("typescript")).default;
  const handbook = await import("../lib/handbook-reader.ts");
  const source = ts.transpileModule(read("OwnerHandbook.tsx"), {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  const state = [
    "## 1. Alpha\nThe full first chapter.\n\n## 2. Beta\nThe full second chapter.\n\n## Reference: activity\nTechnical sample.",
    "",
    "",
    0,
    false,
    0,
  ];
  let cursor = 0;
  let refCursor = 0;
  let focused = 0;
  const refs = [
    { current: { focus: () => focused++, scrollIntoView: () => {} } },
    { current: null },
  ];
  let hash = "";
  const listeners = new Map();
  const effects = [];
  const fakeWindow = {
    location: {
      get hash() {
        return hash;
      },
    },
    history: {
      pushState: (_state, _title, next) => {
        hash = next;
      },
    },
    addEventListener: (event, cb) => listeners.set(event, cb),
    removeEventListener: (event) => listeners.delete(event),
  };
  const mod = { exports: {} };
  new Function("require", "module", "exports", "window", source)(
    (name) => {
      if (name === "react")
        return {
          ...React,
          useRef: () => refs[refCursor++],
          useEffect: (effect) => effects.push(effect),
          useState: () => {
            const i = cursor++;
            return [
              state[i],
              (value) => {
                state[i] = value;
              },
            ];
          },
          useMemo: (factory) => factory(),
          useDeferredValue: (value) => value,
        };
      if (name === "react/jsx-runtime") return jsx;
      if (name === "@/lib/handbook-reader") return handbook;
      if (name === "@/lib/client")
        return { api: () => assert.fail("unexpected network call") };
      if (name.endsWith(".css"))
        return { default: new Proxy({}, { get: (_, key) => key }) };
      throw Error(name);
    },
    mod,
    mod.exports,
    fakeWindow,
  );
  const render = () => {
    cursor = 0;
    refCursor = 0;
    effects.length = 0;
    return mod.exports.default();
  };
  const nodes = (node) =>
    React.isValidElement(node)
      ? [node, ...React.Children.toArray(node.props.children).flatMap(nodes)]
      : [];
  const first = render();
  const markup = renderToStaticMarkup(first);
  assert.match(markup, /The full first chapter/);
  assert.doesNotMatch(markup, /Technical sample|<details/);
  effects[1]();
  const second = nodes(first).find(
    (node) => node.props.href === "#handbook-chapter-2",
  );
  let prevented = false;
  second.props.onClick({
    button: 0,
    preventDefault: () => {
      prevented = true;
    },
  });
  assert.equal(hash, "#handbook-chapter-2");
  assert.equal(prevented, true);
  const secondView = render();
  assert.match(renderToStaticMarkup(secondView), /The full second chapter/);
  effects[2]();
  assert.equal(focused, 1, "explicit chapter link focuses the reader");
  for (const value of ["0", "1", "1"]) {
    const picker = nodes(render()).find(
      (node) => node.props["aria-label"] === "Chapter",
    );
    picker.props.onChange({ target: { value } });
    assert.equal(hash, `#handbook-chapter-${Number(value) + 1}`);
    assert.match(
      renderToStaticMarkup(render()),
      value === "0" ? /The full first chapter/ : /The full second chapter/,
    );
    effects[2]();
  }
  assert.equal(focused, 1, "native selector changes must not move focus");
  hash = "#handbook-chapter-3";
  listeners.get("hashchange")();
  assert.match(renderToStaticMarkup(render()), /Technical sample/);
  assert.equal(
    mod.exports.handbookChapterFromHash("#handbook-chapter-0"),
    null,
  );
  assert.equal(mod.exports.handbookChapterFromHash("#admin-handbook"), 0);
});
