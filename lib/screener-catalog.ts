export type CatalogKind = "fields" | "screens";
export type FieldInfo = {
  name: string;
  label: string;
  group: string;
  unit: string;
  type: string;
  ops: string[];
  sortable: boolean;
  description: string;
  values: string[];
  options: { value: number; label: string }[];
};
export type Preset = {
  id: string;
  name: string;
  summary: string;
  universe: "STOCK" | "ETF";
  filters: {
    fieldName: string;
    op: string;
    value: number | string | null;
    values: string[];
  }[];
  sort: { fieldName: string; dir: "ASC" | "DESC" } | null;
};
export type Catalog =
  | { kind: "fields"; stock: FieldInfo[]; etf: FieldInfo[] }
  | { kind: "screens"; screens: Preset[] };
const ops = ["GTE", "LTE", "GT", "LT", "EQ", "NEQ", "IN", "NOT_IN"];
const record = (v: unknown) => {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw Error();
  return v as Record<string, unknown>;
};
const str = (v: unknown, max = 500) => {
  if (typeof v !== "string" || v.length > max) throw Error();
  return v;
};
const ident = (v: unknown) => {
  const s = str(v, 100);
  if (!/^[A-Za-z0-9_-]+$/.test(s)) throw Error();
  return s;
};
const array = (v: unknown, max: number) => {
  if (!Array.isArray(v) || v.length > max) throw Error();
  return v as unknown[];
};
const unique = <T>(a: T[], key: (x: T) => string) => {
  if (new Set(a.map(key)).size !== a.length) throw Error();
  return a;
};
export function projectCatalog(
  kind: CatalogKind,
  raw: unknown,
): Catalog | null {
  try {
    const r = record(raw);
    if (kind === "fields") {
      const fields = (a: unknown) =>
        unique(
          array(a, 200).map((v) => {
            const f = record(v),
              type = str(f.type, 20);
            if (
              !["NUMBER", "STRING", "ENUM"].includes(type) ||
              typeof f.sortable !== "boolean"
            )
              throw Error();
            const operators = array(f.ops, 8).map((x) => str(x, 20));
            if (operators.some((x) => !ops.includes(x))) throw Error();
            return {
              name: ident(f.name),
              label: str(f.label, 200),
              group: str(f.group, 100),
              unit: f.unit == null ? "Not supplied" : str(f.unit, 100),
              type,
              ops: operators,
              sortable: f.sortable,
              description:
                f.description == null ? "" : str(f.description, 2000),
              values:
                f.values == null
                  ? []
                  : array(f.values, 500).map((x) => str(x, 200)),
              options:
                f.options == null
                  ? []
                  : array(f.options, 100).map((x) => {
                      const o = record(x);
                      if (
                        typeof o.value !== "number" ||
                        !Number.isFinite(o.value)
                      )
                        throw Error();
                      return { value: o.value, label: str(o.label, 200) };
                    }),
            };
          }),
          (f) => f.name,
        );
      return { kind, stock: fields(r.stock), etf: fields(r.etf) };
    }
    const screens = unique(
      array(r.screens, 200).map((v) => {
        const s = record(v),
          p = record(s.plan),
          universe = p.universe ?? "STOCK";
        if (universe !== "STOCK" && universe !== "ETF") throw Error();
        const filters = array(p.filters, 20).map((v) => {
          const f = record(v),
            op = str(f.op, 20);
          if (!ops.includes(op)) throw Error();
          let value: number | string | null = null,
            values: string[] = [];
          if (op === "IN" || op === "NOT_IN")
            values = array(f.values, 100).map((x) => str(x, 200));
          else if (typeof f.value === "number" && Number.isFinite(f.value))
            value = f.value;
          else if (
            typeof f.value === "string" &&
            /^[+-]?(?:\d+\.?\d*|\.\d+)[KMBT]?$/i.test(f.value)
          )
            value = str(f.value, 40);
          else throw Error();
          return {
            fieldName: ident(f.fieldName ?? f.field),
            op,
            value,
            values,
          };
        });
        let sort: Preset["sort"] = null;
        if (p.sort != null) {
          const q = record(p.sort);
          if (q.dir !== "ASC" && q.dir !== "DESC") throw Error();
          sort = { fieldName: ident(q.fieldName ?? q.field), dir: q.dir };
        }
        return {
          id: ident(s.id),
          name: str(s.name, 200),
          summary: s.summary == null ? "" : str(s.summary, 2000),
          universe,
          filters,
          sort,
        } as Preset;
      }),
      (s) => s.id,
    );
    return { kind: "screens", screens };
  } catch {
    return null;
  }
}
