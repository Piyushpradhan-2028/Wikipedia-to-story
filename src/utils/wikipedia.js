// Turns a Wikipedia article URL into structured "story" data:
// a title, short description, hero image, intro extract, and a
// list of { heading, paragraphs } sections built from the article's
// own headings. No API key needed — this only calls Wikipedia's
// public, CORS-enabled endpoints.

const SKIP_HEADINGS = new Set([
  'references',
  'external links',
  'see also',
  'notes',
  'bibliography',
  'further reading',
  'sources',
  'citations',
  'footnotes',
  'gallery',
])

export function parseWikipediaUrl(rawUrl) {
  let url
  try {
    url = new URL(rawUrl.trim())
  } catch {
    throw new Error('That does not look like a valid URL.')
  }
  if (!url.hostname.includes('wikipedia.org')) {
    throw new Error('Please paste a link to a wikipedia.org article.')
  }
  const lang = url.hostname.split('.')[0] || 'en'
  const pathParts = url.pathname.split('/wiki/')
  if (pathParts.length < 2 || !pathParts[1]) {
    throw new Error("That link doesn't point to a specific article (expected .../wiki/Article_Title).")
  }
  const title = decodeURIComponent(pathParts[1].split('#')[0])
  return { lang, title }
}

function splitIntoSections(plainText) {
  const headingRegex = /^(={2,4})\s*(.+?)\s*\1$/
  const lines = plainText.split('\n')

  const sections = []
  let current = { heading: 'Overview', paragraphs: [], skip: false }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    const match = line.match(headingRegex)
    if (match) {
      if (current.paragraphs.length && !current.skip) sections.push(current)
      const heading = match[2].trim()
      current = { heading, paragraphs: [], skip: SKIP_HEADINGS.has(heading.toLowerCase()) }
    } else if (line) {
      current.paragraphs.push(line)
    }
  }
  if (current.paragraphs.length && !current.skip) sections.push(current)

  // Drop very thin sections (stubs, single-line lists) so the page
  // doesn't fill up with near-empty chapters.
  return sections.filter((s) => s.paragraphs.join(' ').length > 60)
}

// Pulls the first "notable number" out of a section's text — a rough,
// generic way to surface a headline figure (a date, a count, a percentage)
// for any topic without knowing anything about the topic itself.
const STAT_REGEX =
  /(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s?(million|billion|thousand|percent|%|km2?|km\/h|kg|tons?|years?|km|miles?|people|deaths|casualties)?/i

export function extractStat(paragraphs) {
  const text = paragraphs.join(' ')
  const match = text.match(STAT_REGEX)
  if (!match) return null
  const numeric = parseFloat(match[1].replace(/,/g, ''))
  if (Number.isNaN(numeric) || numeric <= 1) return null
  return {
    value: numeric,
    display: match[1],
    unit: match[2] || '',
  }
}

export async function fetchWikiStory(rawUrl) {
  const { lang, title } = parseWikipediaUrl(rawUrl)
  const encodedTitle = encodeURIComponent(title)

  const summaryRes = await fetch(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`
  )
  if (!summaryRes.ok) {
    throw new Error("Couldn't find that Wikipedia page. Check the link and try again.")
  }
  const summary = await summaryRes.json()

  const extractRes = await fetch(
    `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&format=json&origin=*&titles=${encodedTitle}`
  )
  if (!extractRes.ok) {
    throw new Error('Wikipedia returned an error while fetching the full article text.')
  }
  const extractData = await extractRes.json()
  const page = Object.values(extractData.query?.pages || {})[0]
  const fullText = page?.extract || ''

  const sections = splitIntoSections(fullText)

  return {
    title: summary.title,
    description: summary.description || '',
    extract: summary.extract || '',
    image: summary.thumbnail?.source || summary.originalimage?.source || null,
    sections,
    sourceUrl: summary.content_urls?.desktop?.page || rawUrl,
  }
}
