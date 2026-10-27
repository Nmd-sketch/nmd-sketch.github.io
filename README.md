# nmd-sketch.github.io

Monochrome portfolio site for **Nmd-Sketch**. The page opens into a fake bash
terminal that runs a `cmake --build .` sequence and then launches `portfolio.exe`,
which reveals the site inside a character-grid TUI window.

Pure black and white, no accent colors. Every line of the window is composed on a
measured character grid (`┌ ┬ ┐ ├ ┼ ┴ ┤ └ ┴ ┘`, reverse-video bars, `~` past the
end of a panel), so it behaves like an ncurses application rather than a web page.

## Sections

- `about` — bio
- `work` — career entries
- `projects` — a submenu of repos (`sniff`, `cctxpack`, `rproxy`) with description,
  tech stack and a GitHub link
- `stack` — languages / libraries / tools
- `contact` — how to reach me

## Development

```bash
npm install
npm run dev
```

The boot sequence doubles as the loading screen, so the window only opens once the
script has played *and* the document fonts are ready. Press any key to skip it.

## Build

```bash
npm run lint
npm run build
```

## Deploy

Deploys run through GitHub Actions on every push to `main`. The workflow lints,
builds and publishes the `dist/` directory via the Pages artifact API.
