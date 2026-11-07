import { workspacePreferences } from "./workspace-preferences.ts";
type Preferences = ReturnType<typeof workspacePreferences>;
type State = { value: Preferences | null; busy: boolean; error: string };
const stores = new WeakMap<
  object,
  { owner: string; store: ReturnType<typeof createStore> }
>();
function createStore() {
  let state: State = { value: null, busy: false, error: "" };
  let queue = Promise.resolve();
  let pending = 0;
  const listeners = new Set<() => void>();
  const update = (patch: Partial<State>) => {
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  };
  return {
    snapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    save(
      patch: Partial<Preferences>,
      fallback: unknown,
      write: (next: Preferences) => Promise<void>,
    ) {
      pending++;
      update({ busy: true, error: "" });
      const task = queue.then(async () => {
        const next = workspacePreferences({
          ...workspacePreferences(state.value ?? fallback),
          ...patch,
        });
        try {
          await write(next);
          update({ value: next, error: "" });
        } catch (e) {
          update({
            error:
              e instanceof Error
                ? e.message
                : "Preferences could not be saved.",
          });
          throw e;
        } finally {
          pending--;
          update({ busy: pending > 0 });
        }
      });
      queue = task.catch(() => {});
      return task;
    },
  };
}
export function preferenceStore(cache: object, owner: string) {
  let entry = stores.get(cache);
  if (!entry || entry.owner !== owner) {
    entry = { owner, store: createStore() };
    stores.set(cache, entry);
  }
  return entry.store;
}
