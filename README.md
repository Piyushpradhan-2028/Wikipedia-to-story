<<<<<<< HEAD
# Wikipedia-to-story
=======
# Wiki Story

Paste a Wikipedia article link, get a scrolling "story" page built
automatically from that article's own summary, image, and section
headings — no writing required.

## Run it in VS Code

1. Open this folder in VS Code.
2. In the terminal:
   ```bash
   npm install
   npm run dev
   ```
3. Open the local URL Vite prints (usually `http://localhost:5173`).
4. Paste a link like `https://en.wikipedia.org/wiki/Atomic_bombings_of_Hiroshima_and_Nagasaki`
   and click **Build the story**.

## How it works

- `src/utils/wikipedia.js` takes the URL apart to get the language
  (e.g. `en`) and article title, then calls two public Wikipedia
  endpoints — no API key needed:
  - `/api/rest_v1/page/summary/...` for the title, short description,
    intro paragraph, and thumbnail image.
  - `/w/api.php?action=query&prop=extracts` for the full plain-text
    article, which it splits into `{ heading, paragraphs }` sections
    using the article's own `== Heading ==` markers. Boilerplate
    sections (References, See also, External links, etc.) are
    dropped automatically.
- `src/components/StoryPage.jsx` renders the hero (title, image,
  intro) followed by one full-screen "chapter" per section, each
  fading in as you scroll to it.
- `src/App.jsx` is just the input form and loading/error states.

## What animates

- **Reading progress bar** at the very top of the page.
- **Story spine** (desktop only, left edge) — a vertical line that fills as
  you scroll, with a dot per chapter that lights up gold once you've
  reached it. A quick "how much is left" map of the whole article.
- **Hero image Ken Burns zoom** — a slow, subtle zoom/pan on the article's
  thumbnail so the top of the page isn't static.
- **Chapter fade-in** — each section fades and slides up into place the
  first time it enters the viewport.
- **Auto-detected stat callout** — for each chapter, `extractStat()` in
  `src/utils/wikipedia.js` looks for the first notable number in that
  section's text (a count, a percentage, a year span, etc.) and, if found,
  displays it as a large number that counts up from 0 when the chapter
  comes into view. This is generic pattern-matching on the article's own
  text — it doesn't know anything about the topic, so it won't catch every
  interesting figure and will occasionally pick an unremarkable one.

## Honest limitations

This only *structures* what's already on the Wikipedia page — it
doesn't rewrite or simplify the prose, and it can't add hand-picked
visuals like the mushroom-cloud animation built for the Hiroshima and
Nagasaki page earlier. Long paragraphs stay long, and the "chapters"
are just the article's own headings in order.

If you want it to also **rewrite each section in simpler language**
or **pick a visual metaphor per section**, the natural next step is
to send the fetched section text to an LLM (e.g. the Claude API) and
render its output instead of the raw Wikipedia text. That needs your
own API key and a small backend or serverless function (browser code
shouldn't hold a secret API key directly) — happy to build that piece
next if you want it.

## Project structure

```
wiki-story-app/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   └── StoryPage.jsx
    └── utils/
        └── wikipedia.js
```
>>>>>>> c2088ba (Initial commit: Wiki Story app)
