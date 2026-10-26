import { symbolInput } from "./format.ts";

/** Validate the supported market universe before spending provider credits. */
export function providerSymbol(value: unknown): string {
  let symbol: string;
  try {
    symbol = symbolInput(value);
  } catch {
    throw Object.assign(
      new Error("Enter a valid stock symbol or crypto pair."),
      { status: 400 },
    );
  }
  if (symbol.includes("/")) {
    if (!/^[A-Z0-9]{2,12}\/USD$/.test(symbol))
      throw Object.assign(new Error("Only USD crypto pairs are supported."), {
        status: 422,
      });
  } else if (!/^[A-Z][A-Z0-9]*(?:[.-][A-Z0-9]+)?$/.test(symbol)) {
    throw Object.assign(
      new Error("Enter a valid stock symbol or crypto pair."),
      { status: 400 },
    );
  }
  return symbol;
}

/** US class-share separator aliases are equivalent; crypto pairs stay separate. */
export const providerIdentity = (symbol: unknown) =>
  String(symbol ?? "")
    .toUpperCase()
    .replaceAll(".", "-");
export const sameProviderSymbol = (left: unknown, right: string) =>
  providerIdentity(left) === providerIdentity(right);
export const twelveSymbol = (symbol: string) =>
  symbol.includes("/") ? symbol : symbol.replaceAll("-", ".");
