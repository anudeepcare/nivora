# Installed iPhone header correction — October 18, 2026

This release changes the status-bar configuration itself from `black-translucent` to `default`. Apple documents the latter as placing web content below the native status bar rather than under it. Reference: https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html

The mobile header now explicitly disables both prefixed and standard backdrop filters. It has an opaque background, stays at the document top, and retains device-reported safe-area padding. No guessed device-specific status-bar heights or synthetic scrolling are used.

A second concrete defect was found: the foundation selectors targeted `#app` / `#main`, but Shell renders `.product` / `.content`. Those selectors now match. The document is the scroll owner, matching navigation restoration. The mobile dock uses fixed positioning, supports link elements as well as buttons, and is hidden while the software keyboard is open.

## Installation

After deploying this build, close the installed app and reopen it. If iOS retains the old installed status-bar configuration, remove the AURYN Home Screen shortcut and add the deployed site again from Safari using Add to Home Screen. This does not delete the server-side portfolio. Any unsaved local input should be saved first.

## Verification limits

The configuration and CSS correction are implemented. Automated tests and build checks do not prove the system-compositor result on a physical iPhone. This release must not be described as a physically verified permanent resolution or a completed all-requirements production release.
