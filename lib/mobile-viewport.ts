/** iOS keyboards resize the visual viewport independently of the layout viewport. */
export function visibleViewport(
  viewport: { height: number; offsetTop: number } | null,
  fallbackHeight: number,
) {
  const height = viewport?.height;
  const top = viewport?.offsetTop;
  return {
    height:
      height != null && Number.isFinite(height) && height > 0
        ? height
        : fallbackHeight,
    top: top != null && Number.isFinite(top) && top > 0 ? top : 0,
  };
}

export function keyboardInset(
  viewport: { height: number; offsetTop: number } | null,
  layoutHeight: number,
) {
  const visible = visibleViewport(viewport, layoutHeight);
  return Math.max(0, layoutHeight - visible.height - visible.top);
}

/** Avoid style/layout invalidation for unchanged visualViewport scroll events. */
export function createViewportUpdater(
  write: (name: string, value: string) => void,
) {
  const previous = new Map<string, string>();
  return (
    viewport: { height: number; offsetTop: number } | null,
    layoutHeight: number,
  ) => {
    const visible = visibleViewport(viewport, layoutHeight);
    const values: Record<string, number> = {
      "--visual-height": visible.height,
      "--keyboard-bottom": keyboardInset(viewport, layoutHeight),
      "--visual-top": visible.top,
    };
    for (const [name, value] of Object.entries(values)) {
      const next = `${value}px`;
      if (previous.get(name) !== next) {
        write(name, next);
        previous.set(name, next);
      }
    }
  };
}
