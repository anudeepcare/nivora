# NIVORA V65.20 — Mobile Dock & Typography Correction
- Root cause fixed: V65.19 used four grid columns for only three mobile destinations.
- Mobile navigation is now a true bottom dock: 3 equal columns, screen-edge aligned, no floating card gap, safe-area aware.
- Main content reserves the dock height so content does not sit underneath navigation.
- Information glyph no longer uses baseline-sensitive SVG text; geometric shapes keep the `i` optically centered.
- Analyze/Portfolio/Trading Lab/Alerts mobile type hierarchy is normalized for readable labels, body text and values.
- Existing scoring/data/trading semantics remain unchanged.
