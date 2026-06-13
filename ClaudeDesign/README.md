# Handoff: DAGitty+ — Causal Diagram (DAG) Editor Redesign

## Overview
DAGitty+ is a modern, accessible redesign of [DAGitty](https://dagitty.net) — a browser tool epidemiologists and researchers use to draw **directed acyclic graphs (DAGs)** representing causal assumptions, and to analyse confounding, identification, and the testable implications of a model.

The design is a single-screen editor: a **drawing canvas** in the centre, a **tool rail** on the left, and a tabbed **analysis inspector** on the right. As the user edits the graph, the app re-runs real graph-theory analysis (causal/biasing path classification, minimal adjustment sets, conditional-independence implications, instrumental variables) and reflects it live in the diagram and the panels.

## About the Design Files
The file in this bundle — **`DAGitty+ Editor.dc.html`** — is a **design reference created in HTML/JS**. It is a working prototype that demonstrates the intended look, layout, interactions, and the analysis algorithms. **It is not production code to copy directly.**

> It is authored in a small in-house "Design Component" runtime (a `<x-dc>` template + a `class Component` logic block). Do **not** port that runtime. Instead, **recreate these designs in the target codebase's existing environment** (React, Vue, Svelte, SwiftUI, etc.) using its established component patterns, state management, and styling system. If no front-end environment exists yet, **React + TypeScript** is the recommended choice for this app (SVG-heavy, lots of derived state).

The one part worth lifting almost verbatim is the **graph-analysis logic** (pure functions over `{nodes, edges, roles}`) — see *Analysis Engine* below. It is framework-agnostic and should be moved into a typed module with unit tests.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, iconography, light/dark theming, and interaction states are all specified. Recreate the UI pixel-faithfully using the codebase's libraries. Exact tokens are in *Design Tokens*.

---

## Layout (single screen, `100vh`, no document scroll)

A vertical flex column:

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER  (56px tall)                                          │
│ logo · nav menus · spacer · [theme] [Export]                │
├──────┬───────────────────────────────────────┬──────────────┤
│ TOOL │ CANVAS  (flex:1)                       │ INSPECTOR    │
│ RAIL │  - dotted-grid background             │ (340px)      │
│ 60px │  - SVG diagram (viewBox 0 0 760 480)  │ tabs +       │
│      │  - floating chips / legend / zoom     │ scroll body  │
├──────┴───────────────────────────────────────┴──────────────┤
│ FOOTER / STATUS BAR  (34px tall)                            │
└─────────────────────────────────────────────────────────────┘
```

- **Header**: `height:56px; padding:0 16px; background:var(--panel); border-bottom:1px solid var(--border)`. Left → right: logo lockup (`DAGitty` + accent `+`), nav menu buttons (Model / Examples / Layout / Help), flex spacer, theme toggle (38×38), Export button.
- **Tool rail**: `width:60px`, vertical stack of 40×40 icon buttons (radius 11px), gap 6px, padded 12px. A `?` help button is pinned to the bottom.
- **Canvas**: `flex:1; position:relative; background:var(--canvas); overflow:hidden`. Contains an absolutely-positioned full-bleed `<svg>`, plus floating overlays (title chip top-left, tool-hint pill top-right, legend bar bottom-left, zoom control bottom-right).
- **Inspector**: `width:340px; border-left:1px solid var(--border)`. A fixed tab strip + a scrolling content area (`overflow-y:auto; padding:16px`).
- **Footer**: `height:34px; font-size:12px; color:var(--dim)`. DAG validity dot + label, variable/edge/causal-path counts, and a keyboard-hint string right-aligned (monospace).

### Responsive
- Breakpoint at **880px**. Below it (`isMobile`), the inspector becomes a **right slide-over drawer**: `position:absolute; top:56px; right:0; bottom:34px; width:min(340px,88vw); transform:translateX(105%)` when closed, `translateX(0)` when open, `transition:transform .22s ease`, plus a dimmed backdrop (`rgba(15,20,32,.4)`). A panel-toggle button appears in the header.
- Below **760px**, the text nav menus hide (`display:none`); use the Model/Examples/etc. actions from elsewhere or a future hamburger.

---

## Screens / Views

There is **one screen**; its "views" are the canvas render modes and the inspector tabs.

### Canvas — node & edge rendering
SVG coordinate space is **`viewBox="0 0 760 480"`, `preserveAspectRatio="xMidYMid meet"`**. All node positions are stored in this space. A `<g>` wraps everything and carries the zoom transform: `transform:scale(zoom); transform-origin:380px 240px` (zoom 0.5–1.8, default 1).

**Nodes** are drawn by *role* (role determines color **and shape** — shape is an accessibility channel so color isn't the only signal):
- **Exposure**: filled circle, r≈25, fill green (`--c-green`), stroke darker green, white label. Small uppercase role caption "exposure" below in green.
- **Outcome**: filled circle, blue (`--c-blue`), white label, caption "outcome".
- **Adjusted (conditioned)**: **rounded square** (rx 8, ~52×52), panel fill, strong dark stroke (2.6px), normal label, caption "adjusted".
- **Unobserved (latent)**: circle with **dashed** stroke (`stroke-dasharray:4 4`), dim stroke + dim label, caption "unobserved".
- **Selection variable**: caption suffix "· sel".
- **Other**: plain circle, panel fill, neutral stroke.
- **Selected for inspection** (UI selection, independent of role): a dashed accent ring around the node (`stroke-dasharray:4 4`, accent color, offset ~7px).
- Node label: 17px / 700, font `--head`. Role caption: 11px / 600, uppercase, letter-spacing .5px.

**Edges** are directed by default. Geometry: trim the line at source radius+3 and target radius+11, draw the line, then a filled **arrowhead polygon** at the target. Edges carry one of three *kinds* (computed live, see engine):
- **causal** — solid, green (`--c-causal`), 2.6px, with a small circular **"C" badge** at the midpoint (circle filled `--panel`, stroked + lettered in the edge color, mono font).
- **biasing** — **dashed** (`8 7`), red (`--c-biasing`), 2.6px, **"B" badge**.
- **neutral** — solid, gray (`--neutral`), 2px, no badge.
- **reversible** (equivalence view only) — dotted (`1 7`), accent color, no arrowhead.

Triple-encoding of paths (color **+** line style **+** letter badge) is an intentional accessibility requirement — keep all three.

**Edge rubber-band preview**: while the Add-connection tool is active and a source is chosen, draw a dashed accent line (`3 6`, opacity .8) from the source node to the cursor.

### Canvas — view modes (right panel "View mode" radios)
The same node set is re-rendered with different edges:
- **Normal** — directed edges with causal/biasing/neutral coloring.
- **Moral graph** — undirected edges: skeleton of the ancestral subgraph of the special nodes, **moralised** (parents of a common child are "married" with an edge). All edges neutral, no arrowheads.
- **Correlation graph** — undirected edge between any pair that is **d-connected** given the adjusted+selection set.
- **Equivalence class (CPDAG)** — compelled edges drawn directed; reversible edges drawn dotted (accent), no arrowhead.

A caption chip appears next to the canvas title when the view ≠ Normal, e.g. "Moral graph" with an eye icon.

### Inspector — Tab: Inspect
- **Selected-variable card** (`border:1px solid --border; radius:14px`): header row with a 42×42 role badge (matches node color/shape) + "Variable {id}" + role summary line. Body: a "ROLE" label and **5 toggle chips** — Exposure (key E), Outcome (O), Adjusted (A), Selected (S), Unobserved (U). Active chip: `border:1px solid --accent; background:--accent-ghost; color:--text`, with a filled dot. Below: **Rename** and **Delete** buttons (Delete is danger-styled).
- **View mode**: 2×2 grid of selectable buttons (Normal / Moral graph / Correlation / Equivalence).
- **Summary**: 2×2 stat tiles (Exposure(s), Outcome(s), Adjusted, Causal paths) — big number in a role color + small label.

### Inspector — Tab: Identify
- **Estimand** `<select>`: Total effect (adjustment) · Direct effect (adjustment) · Causal odds ratio · Instrumental variable.
- **Status box** (variant by result): green ("identifiable" — check icon, `--ok-ghost`), accent ("set exposure/outcome" prompt), or red ("not identifiable" / "cycle" — warning icon, `--danger-ghost`). Title + one-line explanation.
- **Minimal sufficient adjustment sets** (total/direct): list of cards, each a target-circle icon + the set in mono (`{ A, B }` or `∅`) + a right-aligned note.
- **Instrumental variables** (instrument estimand): list of cards, each an accent letter badge + "Instrument X" + conditioning text ("unconditional" or "conditional on { … }").
- **Caution box** (dashed danger border) when the current adjusted selection leaves an open biasing path (e.g. conditioning on a collider).

### Inspector — Tab: Implications
- Intro line, then a list of cards, each: an accent check chip + a conditional-independence statement in mono, e.g. `A ⊥ D | E, Z`. Footer: count + "symbol ⊥ denotes independence". Empty/cyclic → dashed placeholder card.

### Inspector — Tab: Code
- "MODEL CODE" header with a live-status pill (live / unsaved edits / error — green/accent/danger dot).
- An **editable** `<textarea>` (mono, 12.5px, code-bg) containing `dagitty` syntax.
- When edited: **Update diagram** (parses + rebuilds) and **Revert** buttons; when clean: a **Copy code** button. Parse errors show a danger banner.

### Modals (centered card over `rgba(15,20,32,.45)` scrim; card `radius:16px; padding:24px; shadow:0 24px 60px -20px rgba(0,0,0,.5)`)
- **Load** (560px): example chips + a `dagitty`-code textarea + Cancel/Load.
- **Publish** (480px): a read-only shareable URL row with Copy + the model code.
- **Export** (430px): **Format** segmented (PNG 2× / SVG), a **Transparent background** toggle switch, Cancel/Download. PNG renders the SVG to a 2× canvas; SVG is emitted directly. Transparent omits the background `<rect>`.
- **Shortcuts** (420px): rows of action + key badge.
- **About** (420px): logo, blurb, Close.
- **Rename** (340px): single text input, Enter commits / Esc cancels, Cancel/Rename.

### Empty state
When there are no variables, the canvas shows a centered onboarding card: a node-glyph in an accent-ghost rounded square, "Start your causal diagram", a sentence, and two buttons — **Add first variable** (accent) and **Load example model**.

---

## Interactions & Behavior

**Tools (left rail):** Select & move · Add variable · Add connection · Auto-layout · Fit to view.
- **Select**: click a node to select (drives the Inspect tab); drag to reposition (clamped to 34–726 x / 34–446 y in viewBox units). Click empty canvas to deselect.
- **Add variable**: click empty canvas to create a node at that point; auto-named with the next free single letter (A, B, …).
- **Add connection**: click source node, then target node → directed edge (duplicates and reverse-duplicates are rejected). A rubber-band preview follows the cursor between the two clicks.
- **Auto-layout**: longest-path layering — assign each node a layer = longest path from a root; spread layers left→right (x) and distribute within a layer (y). Snaps positions.
- **Fit**: reset zoom to 1.

**Keyboard** (when not typing in an input): `e/o/a/s/u` toggle exposure/outcome/adjusted/selection/unobserved on the selected node; `Delete`/`Backspace` removes it; `Esc` deselects / cancels pending edge. Exposure and outcome are mutually exclusive.

**Theme**: defaults to `prefers-color-scheme`; a header toggle flips light/dark (sun/moon icon swap).

**Zoom**: +/- buttons step by 0.15 (0.5–1.8); the third button shows current % and resets.

**Menus**: top-bar dropdowns (Model/Examples/Layout/Help). Open one closes others; an invisible full-screen backdrop closes on outside click. Items show a label + a small sub-description.

**Transitions**: most hover/active state changes use `transition: all .12s`; the mobile drawer uses `.22s ease`; zoom uses `.18s ease`. No elaborate motion.

---

## State Management

Core state (single store / `useReducer` recommended):

| key | type | notes |
|---|---|---|
| `theme` | `'light' \| 'dark'` | seeds from `prefers-color-scheme` |
| `tool` | `'select' \| 'node' \| 'edge' \| 'layout' \| 'fit'` | |
| `tab` | `'inspect' \| 'identify' \| 'implications' \| 'code'` | |
| `viewMode` | `'normal' \| 'moral' \| 'dependency' \| 'equivalence'` | |
| `effectKind` | `'adj_total' \| 'adj_direct' \| 'adj_causalodds' \| 'instrument'` | |
| `order` | `string[]` | node ids, render/iteration order |
| `pos` | `Record<id, {x,y}>` | in 0..760 × 0..480 space |
| `vars` | `Record<id, {exposure,outcome,adjusted,selection,latent: boolean}>` | |
| `edges` | `{from,to}[]` | directed |
| `selectedId` | `id \| null` | UI selection |
| `zoom` | `number` | 0.5–1.8 |
| `pendingEdge` | `id \| null` | edge-tool source |
| `cursor` | `{x,y} \| null` | for rubber-band preview |
| `menu`, `modal` | `string \| null` | open dropdown / open modal |
| `codeDraft`, `codeDirty`, `codeError` | editing the Code tab | |
| `exportFmt`, `exportTransparent` | export options | |
| `vw`, `panelOpen` | responsive (`window.innerWidth`, mobile drawer) | |

**Derived (recompute on `{order,edges,vars}` change — memoize on a key built from those):** edge kinds, causal-path count, minimal adjustment sets, testable implications, the three view-mode edge sets, DAG validity. Don't store these.

---

## Analysis Engine (lift this logic; it's the heart of the app)

Implement as pure, typed, unit-tested functions over `(ids, edges, roles)`. All run on small graphs; brute force is fine. Algorithms used in the prototype:

- **Build graph**: adjacency (`children`, `parents`), an undirected adjacency that tags each step as `in`/`out`, cached `descendantsOf` / `ancestorsOf`.
- **Acyclicity**: Kahn topological sort; `acyclic = sorted.length === n`.
- **Simple paths**: DFS enumerating simple undirected paths between two nodes (cap ~600), each path tracking per-step edge direction.
- **d-separation / open path**: a path is *open* given conditioning set Z iff every **non-collider** on it is **not** in Z, and every **collider** (`→ v ←`) **is** in Z or has a descendant in Z.
- **Causal vs biasing edges**: a path exposure→outcome is *causal* if every step points forward; its edges are green. Any other path that is *open* given the current adjusted+selection set contributes *biasing* (red) edges.
- **Minimal sufficient adjustment sets (total effect)**: candidates = variables that aren't exposure/outcome, aren't descendants of exposure, aren't latent. Brute-force subsets (sorted by size), keep a subset if it blocks every non-causal exposure→outcome path **and** no smaller kept set is a subset of it. (Direct effect: same idea but block all paths except the direct edge, candidates exclude descendants of the outcome.)
- **Testable implications**: ordered local-Markov basis — in topological order, for each node `v` and each earlier non-parent `w`, emit `w ⊥ v | parents(v)`.
- **Moral graph**: ancestral subgraph of the special nodes → undirected skeleton + "marry" co-parents.
- **Correlation graph**: undirected edge between each pair that is d-connected given adjusted+selection.
- **CPDAG (equivalence)**: orient v-structures (`a→c←b` with `a,b` non-adjacent) as compelled, then apply **Meek's rules R1–R3** to propagate; remaining edges are reversible.
- **Instrumental variables (per Brito–Pearl)**: a variable `I` is an instrument for `E→D` if there is a conditioning set `W` of non-descendants of `D` such that `I` is d-connected to `E` given `W`, and `I` is d-separated from `D` given `W` **in the graph with the `E→D` edge removed**. The prototype searches `W` up to size 2.

---

## dagitty code format (Code tab + Load modal)

```
dag {
  A [exposure,pos="-1.00,0.40"]
  B [outcome,pos="1.00,0.40"]
  C [adjusted,pos="0.00,-1.00"]
  L [latent,pos="0.50,0.50"]
  C -> A
  C -> B
  A -> B
}
```
- Node line: `Name [attr,attr,pos="x,y"]`. Attributes: `exposure`, `outcome`, `adjusted`, `selected`/`selection`, `latent`/`unobserved`.
- Edge line: `X -> Y` (also accept `<-`; chains like `A -> B -> C`).
- **Position mapping** between dagitty coords and the 760×480 canvas:
  `canvasX = dagX * 120 + 380`, `canvasY = dagY * 120 + 240` (and the inverse when generating code). Missing positions fall back to a simple grid.
- Quoted names with spaces should be supported; the prototype's parser is lenient (treats `<->` loosely).

---

## Design Tokens

CSS custom properties are set on the root from a palette function keyed by `(theme)`. Accent is blue (the locked "Clinical" direction). Diagram/semantic colors are intentionally constant across themes (with small light/dark tweaks) so causal semantics read the same.

### Light
| token | value |
|---|---|
| `--bg` | `#eef1f6` |
| `--panel` | `#ffffff` |
| `--panel2` (subtle fill) | `#f5f7fb` |
| `--border` | `#e3e8f0` |
| `--text` | `#16203a` |
| `--dim` (secondary text) | `#5a6678` |
| `--faint` (tertiary) | `#9aa6b8` |
| `--accent` | `#1f6feb` |
| `--accent-ghost` | `rgba(31,111,235,.10)` |
| `--accent-line` | `rgba(31,111,235,.30)` |
| `--canvas` | `#f6f8fc` |
| `--grid` (dot grid) | `#d7deea` |
| `--ok` | `#16a34a` · ghost `#ecfdf3` · line `#bbf2cf` |
| `--danger` | `#dc2626` · ghost `#fef2f2` · line `#f7c7c7` |
| `--code-bg` / `--code-fg` | `#f8fafd` / `#1f2a44` |
| `--shadow` | `0 1px 2px rgba(20,30,55,.06), 0 12px 30px -16px rgba(20,30,55,.22)` |

### Dark
| token | value |
|---|---|
| `--bg` | `#0c0f15` |
| `--panel` | `#141922` |
| `--panel2` | `#1b2230` |
| `--border` | `#262f3d` |
| `--text` | `#e7edf5` |
| `--dim` | `#9aa7b8` |
| `--faint` | `#647084` |
| `--accent` | `#5fa3ff` |
| `--accent-ghost` | `rgba(95,163,255,.16)` |
| `--accent-line` | `rgba(95,163,255,.30)` |
| `--canvas` | `#0a0d12` |
| `--grid` | `#1c2433` |
| `--ok` | `#34d399` · ghost `rgba(52,211,153,.12)` · line `rgba(52,211,153,.3)` |
| `--danger` | `#f87171` · ghost `rgba(248,113,113,.12)` · line `rgba(248,113,113,.3)` |
| `--code-bg` / `--code-fg` | `#0a0d12` / `#cdd6e4` |
| `--shadow` | `0 2px 8px rgba(0,0,0,.4), 0 18px 40px -22px rgba(0,0,0,.7)` |

### Diagram / semantic colors
| role | light | dark |
|---|---|---|
| node neutral fill | `#ffffff` | `#1b2230` |
| node neutral stroke | `#48566b` | `#5b6779` |
| node label | `#16203a` | `#e7edf5` |
| exposure (green) | fill `#16834a`, stroke `#0f5f34` | `#22c55e` / `#16a34a` |
| outcome (blue) | fill `#1d4ed8`, stroke `#1733a8` | `#3b82f6` / `#2563eb` |
| causal path | `#16a34a` | `#34d399` |
| biasing path | `#dc2626` | `#f87171` |
| neutral edge | `#94a3b8` | `#5b6779` |
| dim role caption | `#64748b` | `#94a3b8` |

### Type, spacing, radii
- **Fonts**: UI/body **Inter** (400/500/600/700); code/badges **JetBrains Mono** (400/500). (The prototype also wires Source Serif 4 for an alternate skin — not used in the shipped Clinical direction.)
- **Type ramp**: node label 17/700 · headers 18/700 · panel titles 15–16/600 · body 13–13.5 · captions/labels 11–12.5 · uppercase section labels 11/700 letter-spacing .6px · stat numbers 20/700.
- **Radii**: buttons/inputs 9–11px · cards/panels 12–14px · modals 16px · pills/chips 999px · node square 8px.
- **Spacing**: 16px panel padding; 8–10px between cards/controls; 7px chip gaps; header/footer padding `0 16px`.
- **Icon buttons**: 38–40px hit targets; SVG icons 13–20px, `stroke-width` ~1.9–2.4, `currentColor`.

---

## Assets
No external image assets. All iconography is inline SVG (geometric line icons — cursor, node, edge, layout, fit, theme sun/moon, export, copy, check, warning, close, link, eye). Recreate with the codebase's icon set (e.g. Lucide) at the sizes/stroke weights above; the node/edge **diagram** marks must stay as described (shape-by-role) for accessibility. The logo is three small circles joined by two strokes inside an accent rounded square.

## Files
- `DAGitty+ Editor.dc.html` — the full hi-fi prototype (template markup + the analysis/logic class). Open it in a browser to interact with every state described here; read the logic block for exact algorithm implementations to port.

## Notes for implementation
- Keep the **triple-encoded** path styling (color + dash + letter) and **shape-by-role** nodes — these are the accessibility backbone, not decoration.
- Move the analysis engine into a pure module with tests before wiring UI; it's the riskiest correctness surface.
- The original DAGitty ships a mature JS library (`dagitty.js`) implementing these algorithms robustly; for production you may prefer to depend on / port it rather than re-deriving every routine. The prototype's versions are correct for typical small teaching graphs but were written for clarity, not edge-case completeness.
