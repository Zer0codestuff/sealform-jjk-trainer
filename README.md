# SEALFORM

SEALFORM is an unofficial, fan-made Domain Expansion hand-sign trainer. It pairs sourced online reference panels with private, on-device hand landmark tracking and a locally trainable KNN recognition profile.

## Product modes

- **Learn** — study the sourced reference, finger map, confidence level, and canon limitations for 16 documented activations.
- **Practice** — compare one or two hands against authored geometric rules in real time with MediaPipe Hand Landmarker.
- **Personalize** — capture correct holds and near misses, then export or import the resulting normalized landmark profile.

Camera frames, video, and landmarks are never uploaded. Calibration vectors are stored only in the browser unless the user explicitly exports them.

## Development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm test
```

MediaPipe's WASM runtime and hand model are self-hosted under `public/` so recognition does not depend on a third-party runtime request.

## Disclaimer

SEALFORM is not affiliated with Gege Akutami, Shueisha, MAPPA, or any rights holder. Every reference view links back to its online source, and uncertain or unreproducible activations are labeled rather than scored.
