import { useEffect, useMemo, useState } from 'react'
import { extractStat } from '../utils/wikipedia'
import CountUp from './CountUp'

export default function StoryPage({ data, onReset }) {
  const [scrollPct, setScrollPct] = useState(0)
  const [visible, setVisible] = useState(() => new Set())

  // Precompute an optional headline stat per chapter — purely generic,
  // works for any topic, adds nothing that wasn't already in the text.
  const chapters = useMemo(
    () =>
      data.sections.map((section, i) => ({
        id: `chapter-${i}`,
        ...section,
        stat: extractStat(section.paragraphs),
      })),
    [data]
  )

  const spineIds = ['hero', ...chapters.map((c) => c.id), 'close']

  useEffect(() => {
    function onScroll() {
      const h = document.documentElement
      const total = h.scrollHeight - h.clientHeight
      setScrollPct(total > 0 ? (h.scrollTop / total) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const targets = document.querySelectorAll('[data-story-id]')
    const io = new IntersectionObserver(
      (entries) => {
        setVisible((prev) => {
          const next = new Set(prev)
          let changed = false
          entries.forEach((entry) => {
            if (entry.isIntersecting && !next.has(entry.target.dataset.storyId)) {
              next.add(entry.target.dataset.storyId)
              changed = true
            }
          })
          return changed ? next : prev
        })
      },
      { threshold: 0.18 }
    )
    targets.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [data])

  return (
    <div className="story">
      <div className="progress" style={{ width: scrollPct + '%' }} />
      <button className="back-btn" onClick={onReset}>
        ← New topic
      </button>

      {/* Story spine: a scroll-linked map of the whole page */}
      <nav className="spine" aria-hidden="true">
        <div className="spine-track">
          <div className="spine-fill" style={{ height: scrollPct + '%' }} />
        </div>
        {spineIds.map((id) => (
          <span key={id} className={`spine-dot ${visible.has(id) ? 'reached' : ''}`} />
        ))}
      </nav>

      <section className="hero" data-story-id="hero">
        <p className="eyebrow">FROM WIKIPEDIA</p>
        <h1>{data.title}</h1>
        {data.description && <p className="description">{data.description}</p>}
        {data.image && (
          <div className="hero-image-frame">
            <img className="hero-image" src={data.image} alt={data.title} />
          </div>
        )}
        {data.extract && <p className="intro">{data.extract}</p>}
      </section>

      {chapters.map((chapter, i) => (
        <section
          className={`chapter ${visible.has(chapter.id) ? 'visible' : ''}`}
          data-story-id={chapter.id}
          key={chapter.id}
        >
          <div className="chapter-top">
            <p className="chapter-index">{String(i + 1).padStart(2, '0')}</p>
            {chapter.stat && (
              <div className="stat-callout">
                <span className="stat-number">
                  <CountUp value={chapter.stat.value} active={visible.has(chapter.id)} />
                </span>
                {chapter.stat.unit && <span className="stat-unit">{chapter.stat.unit}</span>}
              </div>
            )}
          </div>
          <h2>{chapter.heading}</h2>
          {chapter.paragraphs.slice(0, 4).map((p, j) => (
            <p key={j}>{p}</p>
          ))}
        </section>
      ))}

      <section className="close" data-story-id="close">
        <p className="eyebrow">SOURCE</p>
        <p>
          Built automatically from the Wikipedia article on <strong>{data.title}</strong>.{' '}
          <a href={data.sourceUrl} target="_blank" rel="noreferrer">
            Read the full article →
          </a>
        </p>
      </section>
    </div>
  )
}
