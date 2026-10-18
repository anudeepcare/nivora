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
