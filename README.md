<div align=center>

# [utilitySyscall](https://initsyscall.codeberg.page/utilitySyscall)

Suckless Web Utils. No build steps. No dependencies. No subscriptions.
A lightweight toolkit for the web, built to replace bloated "SaaS" platforms with simple, local-first alternatives.

</div>

## About

utilitySyscall is a collection of self-contained, modular web utilities designed for developers. Each utility runs entirely in the browser with no build process required.

### Features

- **Mobile-first design** - Responsive layout works on all devices
- **Theme switching** - Night and Day themes via themeInit.json
- **No dependencies** - Pure HTML/CSS/JS
- **Local-first** - Runs entirely in your browser

## Utilities

| Utility | Description |
|---------|-------------|
| renderMarkdown | Markdown editor with live preview, syntax highlighting, KaTeX math, and PDF/HTML export |

## Quick Start

### Website

This repository is live at [utilitySyscall](https://initsyscall.codeberg.org/utilitySyscall

### For Local usage

1. Clone the repository
2. Start a local server: `python3 -m http.server 8000`
3. Open `http://localhost:8000`

## Project Structure

```
.
├── index.html              # Main dashboard
├── src/
│   ├── index.json        # Utilities registry
│   └── utils/
│       └── renderMarkdown/ # example
│           ├── index.html
│           ├── css/
│           ├── js/
│           └── default.md
├── themeInit.json        # Theme definitions
└── README.md
```

## Theme System

Theme used here is also my another project: [themeInit](https://codeberg.org/initsyscall/themeInit)

## License

Licensed under the Apache License 2.0. See LICENSE file for details.

---

*Built by initsyscall*
