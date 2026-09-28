import { useState } from 'react'
import { fetchWikiStory } from './utils/wikipedia'
import StoryPage from './components/StoryPage'

export default function App() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | error | ready
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!url.trim()) return
    setStatus('loading')
    setError('')
    try {
      const story = await fetchWikiStory(url)
      if (!story.sections.length) {
        throw new Error(
          'That article came back with no usable sections — try a longer, more established article.'
        )
      }
      setData(story)
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'Something went wrong fetching that page.')
      setStatus('error')
    }
  }

  function reset() {
    setStatus('idle')
    setData(null)
    setUrl('')
    setError('')
  }

  if (status === 'ready' && data) {
    return <StoryPage data={data} onReset={reset} />
  }

  return (
    <div className="landing">
      <div className="landing-inner">
        <p className="eyebrow">WIKI STORY</p>
        <h1>Turn any Wikipedia article into a scroll story.</h1>
        <p className="sub">
          Paste a Wikipedia link below. The page is built automatically from that
          article's own summary, image, and section headings — nothing is written
          by hand.
        </p>
        <form onSubmit={handleSubmit} className="url-form">
          <input
            type="url"
            required
            placeholder="https://en.wikipedia.org/wiki/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Building…' : 'Build the story'}
          </button>
        </form>
        {status === 'error' && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
