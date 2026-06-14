# Security Policy

## Reporting a vulnerability

Please report security issues privately rather than opening a public
issue.

- Preferred: open a private report through GitHub Security Advisories at
  <https://github.com/choxos/dagittyplus/security/advisories/new>.
- Alternatively, email <ahmad.pub@gmail.com>.

Include the affected surface (R package, bundled Shiny app, or web
editor), a description, and steps to reproduce. You can expect an
acknowledgment within a few days.

## Supported versions

Fixes are applied to the latest release on the default branch. There is
no long-term support branch.

## Scope notes

- The causal-analysis engine (`inst/js/dagitty-alg.js`, and the web
  app’s `public/dagitty-alg.js`) is a vendored build of the upstream
  DAGitty engine. Engine-level issues may also need to be reported
  upstream at <https://github.com/jtextor/dagitty>.
- The web editor and the bundled Shiny app run entirely client side and
  do not transmit model data to any server.
