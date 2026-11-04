# PWA surface sampling correction

The deployed document and stylesheet were fetched on October 18 at approximately 18:07 America/Chicago. They contained the root status surface and min-height:8px. The latest screenshot still showed a blur, so the previous correction was not accepted as resolved. This was not treated as a stale-deployment problem.

WebKit LocalFrameView::fixedContainerEdges contains thinBorderWidth=10. Its primaryBackgroundColorForRenderer returns no direct background colour when the box width or height is <=10. The earlier 8px minimum did not meet that path when safe-area-inset-top was zero. The existence of a fallback pixel sampler means this source condition alone is not proof of the device symptom's sole cause.

The persistent root surface now has at least 12 CSS pixels of height and full viewport width. It remains fixed at top:0. Its opaque computed background is clipped to text; since the element is empty, it paints no bar over controls while still supplying a computed background colour for the direct sampling path. Its stacking level makes it the top document sampling candidate. No timed overlays, scroll nudges, viewport resizing, provider changes, page redesign or account-state changes were added.

Sources:
- WebKit source: https://chromium.googlesource.com/external/github.com/WebKit/webkit/+/0d05b141742c9d80af6d6668505becd6a23f20fa/Source/WebCore/page/LocalFrameView.cpp
- First-hand investigation of WebKit and iOS 27: https://zenn.dev/uakihir0/articles/260920-ios27-pwa-blur

The regression test now fails at 8px and requires >10px plus the paint-free clip. The prior 6px test criterion was inadequate and has been corrected. Page styles and root layout were byte-compared with the prior ZIP and are unchanged. Physical-device acceptance is not established by the unit tests or build.
