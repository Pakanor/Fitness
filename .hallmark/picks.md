**Hallmark · v2.0.0**

- **Shape** · Stage-hero landing (HomePage) · genre editorial · job: sign up · draw: 0e5f4d (swap: Corridor→Stage; design.md locked system and the real product screenshot refuse Corridor)
- **Theme** · Sport (design.md locked, deal 1/3, seed 073fe46f) · genre editorial · posture restrained · axes: light/display-condensed/chromatic-volt
- **Chrome** · nav: edge-aligned, wordmark (FitnessApp) and one action (Załóż konto) · footer: letter close, wordmark over three links
- **Hero** · Stage: head on columns 1–5, the slot on 6–12 at 60–75% screen tall, content centred in the screen (1.0–1.5× below/above)
- **Signature** · the real product screenshot shown large in the Stage hero (public/images/screens/product-home-desktop.png, captured with headless Chrome from the running dev server)
- **Sections** · Hero (the product screenshot) · Bento (four named moments) · Pricing table (slotted prices) · Rows (three questions) · Close band (Załóż konto again) · Footer (letter close)
- **Material** · real: the captured home screen; Polish product copy retained · pictures: product screenshots in slots marked data-kind="product" (do not count toward the photo balance) · absent: invented testimonials/metrics (removed, Floor 46a), user photos, real prices (slotted)
- **Sweep** · sloplint static tier clean: 0 FAIL · 0 REFLEX · 0 WARN; legacy `tokens.css` (dark theme + fixed noise overlay) clashed with the Sport light surface — neutralised `body::before` noise and dark body remnant in `homepage.css`; render tier unavailable (no puppeteer-core), render-tier/J gates judged in-thread and satisfied by construction
- **Fixes since first build** · removed legacy dark-theme/noise clash causing style overlap with the old page; hero height uses `calc(100dvh − nav)` so it fills exactly one screen under the nav
- **Finish-review** · in-thread · 6 findings · 6 resolved · gap: none

Material ask:
- Slot `hero`: product home screenshot, 16:9, ~864 × 486 px at 1440 (data-kind="product") — user's own full-fidelity screenshot replaces the capture.
- Slot `demo-1`: a second, distinct product screen (a workout in progress / the exercise-start view), 4:3, ~416 × 312 px at 1440 — right now it reuses the home capture, which is the weakest point; one real in-app screenshot here most improves the page.
- Footer links (Regulamin, Polityka prywatności, Kontakt) use `href="#"` pending real URLs — the handoff names the endpoints they need.
