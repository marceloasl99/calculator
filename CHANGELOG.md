# Changelog

All notable changes to Scientific Calculator Pro are documented here.
The project follows [Semantic Versioning](https://semver.org/).

## [2.1.0] — 2026-10-16

### Added
- **IT Converter** — a new full-page view opened by the **IT Converter** button in the header (the same button switches back to the calculator; the choice is remembered). Seven tools, all recalculating live, with every result clickable to copy:
  - **Network / CIDR**: IPv4 subnet calculator (network, mask, wildcard, broadcast, first/last host, usable hosts, class, address type such as private/CGNAT/loopback, IP as integer and hex), accepts `/prefix` or dotted masks, prefix slider, "hosts needed → prefix", colored binary breakdown of network vs host bits, subnet splitting table, and IPv6 expand/compress/network/range.
  - **Bases & bits**: binary, octal, decimal and hexadecimal with BYTE/WORD/DWORD/QWORD word sizes, clickable bit grid showing each bit's weight (`00000010₂ = 2¹ = 2`), signed (two's complement) and unsigned values, big/little-endian bytes, bit count, ranges and a powers-of-two table.
  - **Bits & bytes**: bit, byte, SI multiples (kB, MB, GB, TB, PB) and IEC multiples (KiB, MiB, GiB, TiB, PiB), plus download/transfer time for a size at a given link speed.
  - **Text & encoding**: UTF-8 text to hex, binary, decimal bytes, Base64, URL encoding and Unicode code points, and decoding back.
  - **Unix timestamp**: seconds or milliseconds to local time, UTC ISO 8601 and relative time; local date to timestamp; "Now" button.
  - **Colors**: HEX ↔ RGB ↔ HSL ↔ decimal with a preview and WCAG contrast on white and black.
  - **chmod permissions**: octal ↔ symbolic (`755` ↔ `rwxr-xr-x`) with a clickable owner/group/others matrix.
- Deep links `?app=converter` and `?tool=network|bases|data|text|time|color|chmod`.
- All converter text translated into the six languages; 10 new automated tests (64 in total).

### Changed
- Calculator keyboard shortcuts are paused while the IT Converter is open, so typing never reaches the hidden calculator.

## [2.0.0] — 2026-10-16

### Added
- **Function plotter** (Expert → Graphs): up to three functions of `x` on a canvas, with drag-to-pan, mouse-wheel zoom, zoom buttons, a hover tooltip that reads every curve, and automatic detection of roots and local extrema. Curves break correctly at asymptotes (e.g. `1/x`, `tan(x)`).
- **Finance lab** (Expert → Finance): compound interest with periodic contributions and a balance chart, loan amortization with the **Price** (constant installments) and **SAC** (constant amortization) systems including the full schedule, and interest-rate conversion between daily, monthly and yearly periods.
- **User variables**: type `r = 5` and press `=`, then use `π r^2` anywhere. Variables are saved, listed as chips under the display and in the Constants panel, and can be deleted. Reserved names (functions and constants) are rejected with a clear error.
- **Physical constants library**: 15 CODATA 2018 constants (`c`, `h`, `hbar`, `G`, `g0`, `NA`, `kB`, `R`, `qe`, `me`, `mp`, `eps0`, `mu0`, `sigma`, `atm`) usable directly in expressions, searchable and insertable with one click.
- **Live result preview** while typing (can be turned off in Settings).
- **2nd / hyp keypad layers**: the scientific keypad now has 25 keys with second functions (inverse trig, eˣ, 10ˣ, x³, ⁿ√x, ∛x, 2ˣ, |x|, log_b, nPr, lcm, floor) and hyperbolic functions, like a physical scientific calculator.
- **Caret-aware editing**: keypad input and backspace work at the cursor position; backspace removes a whole function name such as `sin(`.
- **Continue from the result**: after `=`, pressing an operator continues from `ans`, while a digit starts a new expression.
- **History upgrades**: click an expression to load it or a result to insert it, export to **CSV** or **JSON**, and browse earlier expressions with `↑` / `↓`.
- **Shareable links**: copy a URL that reopens the calculator with the same expression, mode and angle unit.
- **Plot from the calculator**: send the current expression straight to the plotter.
- **Statistics histogram** and structured result cards for every lab (matrices are rendered as real matrices, unit conversions as a full table).
- **Mobile navigation bar** (Calculator · History · Lab · Constants) so phones show one panel at a time.
- **Two new themes**: Aurora and Sunset (10 themes in total), plus automatic contrast for custom accent colors.
- Keyboard shortcuts: `?` opens help, `Ctrl+C` copies the result, `Esc` closes dialogs; clicking outside a dialog closes it.
- Memory register is now persisted between sessions.
- `npm run build` regenerates `standalone.html` from the modular sources; `npm run sync-locales` regenerates `js/i18n.js` from `locales/*.json`.
- 15 new automated tests (54 Node.js tests in total, 36 in the in-browser runner).

### Changed
- Complete visual redesign: new design tokens, Inter + JetBrains Mono typography, ambient background, glass panels, SVG icon set, refined keypad and result display, scientific notation rendered as `× 10⁻³⁴`.
- Header simplified: language, theme and icon buttons for tests, help and settings; layout and Master Prompt moved into Settings.
- Service worker switched to network-first with offline fallback, so new deployments are picked up immediately.
- `locales/*.json` is now the single source of truth for translations.

### Fixed
- The Primes & Bases lab crashed on every action (it called functions that were never imported).
- The in-browser test runner overwrote the user's saved preferences and **erased the calculation history**; it now runs against an isolated in-memory store.
- Floating-point cleanup rounded every value below 1e-15 to zero (Planck's constant became 0); cancellation residue is now measured relative to the operands.
- Pressing `=` repeated a stale operation after evaluating an expression without a trailing operator.
- `?tests=1` deep link referenced a missing helper and a missing button.
- The README linked to a `LICENSE` file that did not exist.

## [1.0.0] — 2026-10-14

- Initial release: Simple, Intermediate and Expert modes; 7 expert labs (complex numbers, matrices, statistics, equation solver, calculus, units, number theory); 8 themes; 6 languages; PWA; 39 automated tests.
