# 05 -- Head-Pose Navigation

## Intent

Hands-free browsing. You look at a part of the sky and the article there opens. It should feel like the system reads your attention, not like you're controlling a joystick with your face.

---

## Architecture

```
Camera stream (getUserMedia)
    |
MediaPipe FaceLandmarker (GPU delegate)
    |
4x4 facial transformation matrix
    |
Extract yaw (atan2) + pitch (asin) -> normalize to [-1, +1]
    |
Auto-calibration offset subtracted
    |
EMA smoothing (alpha=0.7)
    |
GazeLearner correction (passive calibration from clicks)
    |
Position-based camera steering + article auto-open
```

## Position-Based Steering (Not Velocity)

This is critical: head position maps to an **angular offset** from a base rotation. It's NOT a joystick.

- Turn head right -> camera looks right of base position
- Return head to center -> camera returns to base
- Holding head still = camera stays still (no continuous rotation)

```
baseRotation = last drag endpoint or focus animation endpoint
headOffset = applyAxis(headPose.yaw) * maxOffset
targetRotation = baseRotation + headOffset
camera lerps toward target at 0.18/frame
```

| Parameter | Value |
|-----------|-------|
| Max angular offset | +/-60deg from base |
| Dead zone | 0.05 |
| Lerp speed | 0.18 per frame |

## Calibration

**Initial:** No manual step. The first ~0.5 second (15 frames at 60fps) of face readings are averaged as the neutral offset. Your natural resting head position = center (0, 0).

**Rolling recalibration:** After initial calibration, the neutral offset continuously adapts via a slow-moving average (alpha=0.005). This prevents drift from posture changes -- slouching, leaning, shifting in your chair.

**GazeLearner (passive):** Every click during gaze mode records head pose + card direction as ground truth. After 5 samples, a weighted linear regression model starts correcting the raw head pose. Full confidence at 20 samples. Uses exponential time decay (60s half-life) so recent clicks matter more.

**Equatorial gravity:** The camera's base rotation is gently pulled toward the equator (phi=PI/2) at 0.003/frame when gaze mode is active. This prevents the focus animation cycle from ratcheting the base rotation toward poles.

## Head Pose Detection

| Parameter | Value |
|-----------|-------|
| Detection FPS | 60 (throttled via RAF) |
| Smoothing | EMA alpha=0.7 |
| Calibration frames | 15 (~0.5s) |
| Normalization | +/-12deg head turn = full [-1, +1] |
| Model | face_landmarker/float16 via CDN |
| GPU delegate | Enabled |

## Reading Protection

When a card is selected and the user's head movement is small (magnitude < 0.35), gaze switching is suppressed. This prevents eye-scanning (reading down a text) from being misinterpreted as a head turn.

**Occlusion filter:** Cards within 15deg of the currently selected card are excluded from gaze auto-browse. These cards are visually hidden behind the open article, so the user has never seen them.

## Article Auto-Open

When gaze is active and auto-open is enabled, the nearest article opens automatically:

- **GAZE_LEAD (65deg):** Search looks ahead of camera in head direction, not at view center
- This feels natural -- you look toward something and it opens

**Timing rules:**

| Parameter | Value | Purpose |
|-----------|-------|---------|
| MIN_DISPLAY_MS | 3,000ms | Minimum time article stays open |
| AWAY_CLOSE_MS | 500ms | Time looking away before switching |

**Switching logic:**
1. No article open -> open nearest immediately
2. Same article -> reset away timer
3. Different article, within min display -> keep current
4. Different article, past min display -> start away timer -> switch after 500ms

## Auto-Open Toggle

Users can disable automatic article opening via a top-right toggle button ("Auto-open"). When off:
- Gaze still steers the camera and highlights the nearest card
- Cards only open on explicit click
- Useful for freely exploring the space without articles popping open

## Mode States

```
'off' -> 'consent' -> 'active'
          ^                |
          +-- toggle off --+
```

No calibration step between consent and active.

## Face Preview

- Fixed bottom-left (16px, 20px)
- 320x240, border-radius 16px
- Mirror: CSS scaleX(-1)
- Closeable toggle

## Privacy

- MediaPipe runs 100% client-side
- No video frames leave the browser
- No video recorded
- Only derived yaw/pitch used
- Camera preview always visible
- Toggle on/off anytime

## Key Files

- `src/hooks/useGazeTracking.ts` -- getUserMedia wrapper
- `src/hooks/useHeadPose.ts` -- MediaPipe FaceLandmarker, auto-calibration, rolling recalibration
- `src/lib/gazeLearner.ts` -- Passive gaze correction from click ground truth
- `src/components/MapMode/Canvas3D.tsx` -- gazeSteer handling in RotationCamera
- `src/components/CosmosExperience.tsx` -- gaze mode state, auto-open logic, reading protection, occlusion filter
- `src/components/UI/CameraConsent.tsx` -- consent overlay
- `src/components/UI/FacePreview.tsx` -- camera preview
