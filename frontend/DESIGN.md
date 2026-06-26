# Design System: Bridgenton-Cosmic Lab

## 1. Visual Theme & Atmosphere
(A restrained, futuristic research lab interface with confident asymmetric layouts  
and fluid spring-physics motion. The atmosphere is clinical yet warm — like  
a well-lit digital architecture studio with high-density data visualization)

## 2. Color Palette & Roles
- **Canvas White** (#F9FAFB) — Primary background surface
- **Pure Surface** (#FFFFFF) — Card and container fill
- **Charcoal Ink** (#18181B) — Primary text, Zinc-950 depth
- **Muted Steel** (#71717A) — Secondary text, descriptions, metadata
- **Whisper Border** (rgba(226,232,240,0.5)) — Card borders, 1px structural lines
- **Linoblue Accent** (#2dd4bf) — Single accent for CTAs, active states, focus rings  
  (Max 1 accent. Saturation < 80%. No purple/neon. Strictly linoblue for accents)

## 3. Typography Rules
- **Display:** Futura Bold — Track-tight, controlled scale, weight-driven hierarchy
- **Body:** Futura Book — Relaxed leading, 65ch max-width, neutral secondary color
- **Mono:** Futura Mono — For code, metadata, timestamps, high-density numbers
- **Banned:** Inter, generic system fonts for premium contexts. Serif fonts banned in dashboards.

## 4. Component Stylings
* **Buttons:** Flat, no outer glow. Tactile -1px translate on active. Accent fill for primary, ghost/outline for secondary.
* **Cards:** Generously rounded corners (2.5rem). Diffused whisper shadow. Used only when elevation serves hierarchy. High-density: replace with border-top dividers.
* **Inputs:** Label above, error below. Focus ring in accent color. No floating labels.
* **Loaders:** Skeletal shimmer matching exact layout dimensions. No circular spinners.
* **Empty States:** Composed, illustrated compositions — not just "No data" text.

## 5. Layout Principles
Grid-first responsive architecture. Asymmetric splits for Hero sections.  
Strict single-column collapse below 768px. Max-width containment.  
No flexbox percentage math. Generous internal padding.

## 6. Motion & Interaction
Spring physics for all interactive elements. Staggered cascade reveals.  
Perpetual micro-loops on active dashboard components. Hardware-accelerated  
transforms only. Isolated Client Components for CPU-heavy animations.

## 7. Anti-Patterns (Banned)
Explicit list of forbidden patterns:
- No emojis anywhere
- No `Inter` font
- No pure black (`#000000`) — use Off-Black, Zinc-950, or Charcoal
- No neon/outer glow shadows
- No oversaturated accents
- No purple button glows, no neon gradients
- No custom mouse cursors
- No overlapping elements — clean spatial separation always
- No 3-column equal card layouts — use staggered grids or horizontal scroll
- No generic names ("John Doe", "Acme", "Nexus")
- No fake round numbers (`99.99%`, `50%`)
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen")
- No filler UI text: "Scroll to explore", "Swipe down", scroll arrows, bouncing chevrons
- No broken Unsplash links — use `picsum.photos` or SVG avatars
- No centered Hero sections (for high-variance projects)
- No CSS Grid `calc()` hacks — use strict grid-template
- The "AI Purple/Blue Neon" aesthetic is strictly BANNED
- No acid-saturated colors or electric gradients
- No kinetic typefaces that scream instead of whisper
- No AI-generated copy that sounds like a thesaurus exploded

## Common Pitfalls to Avoid
- Using technical jargon without translation ("rounded-xl" instead of "generously rounded corners")
- Omitting hex codes or using only descriptive names
- Forgetting functional roles of design elements
- Being too vague in atmosphere descriptions
- Ignoring the anti-pattern list — these are what make the output premium
- Defaulting to generic "safe" designs instead of enforcing the curated aesthetic