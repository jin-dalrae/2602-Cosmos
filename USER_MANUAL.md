# COSMOS User Manual

A guide to navigating the planetarium of conversation.

**Live:** [cosmosweb.web.app](https://cosmosweb.web.app)

---

## Quick Start

1. Open [cosmosweb.web.app](https://cosmosweb.web.app)
2. Click **Enter COSMOS** on the landing page
3. Wait for the constellation to assemble — Claude is analyzing each post in real time
4. Drag to look around. Click any card to read.

That's the minimum. Everything below is optional depth.

---

## The Three Ways to Navigate

You're standing at the center of a sphere. Posts are arranged around you like stars. There are three ways to turn your head:

### 1. Drag (always on)

Click and drag anywhere on the background. The sphere rotates under your gaze. The drag threshold is 3 pixels — a true click won't accidentally rotate.

- **Slow drag** = browsing
- **Fast drag** = sweeping across the sky to a different topic cluster
- **Drag while reading** = peek behind the open article without closing it

### 2. Gaze (head-pose, hands-free)

Top-right corner → click **Gaze**. The first time, the browser asks for camera permission. After that, just move your head — small tilts rotate the sphere in real time.

- Your camera feed never leaves the browser. MediaPipe runs entirely on-device.
- A small face preview appears in the corner so you know tracking is live.
- The system learns your natural head position over time — there's no calibration step.
- Click **Gaze** again to turn it off.

**Tip:** Gaze mode pauses while you hover over an open article — small head movements while reading text don't switch the article on you.

### 3. VR (WebXR — Quest, Vision Pro, etc.)

Top-right corner → click **VR**. The button only appears if your browser supports immersive WebXR.

- On Meta Quest browser, Apple Vision Pro browser, or any WebXR-capable headset, the button shows up automatically.
- Click it to enter the headset's immersive mode. Your physical head pose now drives the camera directly.
- Click **Exit VR** (or hit the headset's home button) to come back to flat mode.

**Tip:** WebXR requires HTTPS. The production site at cosmosweb.web.app works out of the box. For local development with a real headset, you'll need ngrok or a self-signed cert.

---

## Reading Articles

### Opening a card

- Click any card → it opens in the center.
- In **Gaze** or **Drag** mode with auto-open enabled, just looking at a card opens it after ~3 seconds. No clicking required.
- Once open, the article expands into a readable panel. Scroll inside it to read.

### Closing a card

- Click the background (anywhere not on the card)
- Or drag the sphere — the card auto-closes
- Or click the X in the corner of the article

### Navigating related posts

Open an article and you'll see:
- **Constellation edges** — colored lines connecting it to related posts (agrees, disagrees, extends, challenges)
- **Replies inline** — direct replies to the post appear underneath
- **"Related" suggestions** — posts that share assumptions or sit nearby in the cluster

Click any of these to follow the thread.

---

## Time Navigation

Posts have age. The cosmos shows recent ones clearly and older ones in subtle fog.

- **Two-finger scroll** (or scroll wheel) on the background → rotates through the timeline
- Newer posts brighten; older ones dim toward 60% brightness
- The rotation is **endless** — keep scrolling and you wrap back to the start
- Cards never move; only their visual prominence and z-order change

This is rank-based, not timestamp-based: every post gets an even slot in the rotation, so dense clusters of posts don't compress.

---

## Zooming

- **Pinch** the trackpad (or Ctrl+scroll) → adjust FOV from 30° (narrow, like zooming in) to 110° (wide, like leaning back)
- This doesn't move you closer or farther — your position stays at the center. It changes how much of the sphere fills your view.

---

## Posting and Replying

- **Compose icon** (bottom of screen) → opens the post composer. Type your thought. Claude classifies and places it on the sphere in real time.
- **Reply icon** on any open card → reply to that specific post. Your reply lands near the parent on the sphere and connects via a constellation edge.
- **Up/down vote** → on any open card. Votes are anonymous and don't affect position.

---

## Mode Toggles (top-right)

| Button | What it does |
|--------|-------------|
| **VR** | Enter WebXR immersive mode. Only visible on supported devices. |
| **Gaze** | Toggle head-pose navigation. Requires camera permission. |
| **Drag** | Toggle drag-browse mode — sidebar shows the post closest to the center while you drag. |

---

## Settings Panel

Click the gear icon (top-left) to open Control Panel:

- **Card size** — scale the article cards up/down
- **Article zoom** — how much the focused article scales when opened
- **Edge opacity** — visibility of constellation lines
- **Damping** — how much rotational momentum carries after you stop dragging

These are persistent for your session but reset on reload.

---

## Tips for Best Experience

- **Use Chrome or Edge** for full WebXR support. Safari works for everything except VR mode (as of early 2026).
- **A real keyboard helps.** Trackpad pinch + scroll feels natural for time and zoom.
- **Try one mode at a time.** Drag → Gaze → VR is a progression. Start with drag, work up.
- **Don't worry about reading every post.** The point is to see the *shape* of the conversation, not the entirety of it.
- **The cosmos is alive.** New posts appear as Claude analyzes them. Sometimes the sphere shifts as the architect agent refines positions.

---

## Privacy & Data

- Camera data: 100% client-side. Never uploaded.
- Posts: stored in MongoDB. Anonymous unless you sign in.
- Analytics: Firebase Analytics tracks aggregate page views and sessions. No PII.
- Full details: [Privacy Policy](https://cosmosweb.web.app/privacy)

---

## Troubleshooting

**The VR button isn't showing up.**
Your browser doesn't support WebXR for VR sessions. Try Meta Quest browser, Apple Vision Pro browser, or Chrome with the WebXR API Emulator extension.

**Gaze mode isn't tracking.**
Check you granted camera permission. The face preview in the corner should show your face — if it's blank, MediaPipe failed to initialize. Reload and try again.

**The sphere is laggy.**
Pinch out to widen FOV (fewer cards in view) or lower card size in the Control Panel. The performance budget is tuned for integrated graphics; older machines may struggle.

**Articles don't open when I look at them.**
Auto-open is disabled if you've manually closed an article recently. Click on a card directly to reopen behavior.

---

## Feedback

DM [@DalraeJin](https://x.com/DalraeJin) on X, or open an issue on the project repo.

(c) 2026 Rae Jin
