// Generates public/articles.json — 240 deterministic mock articles.
// Usage: npm run generate:articles
import { writeFileSync } from 'node:fs'

const PER_CATEGORY = 40

const CATEGORIES = {
  Politics: {
    topic: 'local budgets',
    subjects: ['City council', 'State legislature', 'Election board', 'Senate panel', 'Transport minister', 'Budget committee', 'Planning authority', 'Opposition party'],
    actions: ['approves new housing plan', 'delays vote on budget', 'unveils transparency rules', 'faces pressure over spending', 'opens inquiry into contracts', 'agrees compromise on funding'],
  },
  Business: {
    topic: 'consumer prices',
    subjects: ['Regional bank', 'Retail chain', 'Shipping giant', 'Airline group', 'Energy supplier', 'Food producer', 'Car maker', 'Insurance firm'],
    actions: ['reports record quarterly profit', 'plans thousands of new hires', 'warns of rising costs', 'agrees surprise merger', 'cuts forecast for next year', 'opens new regional hub'],
  },
  Tech: {
    topic: 'everyday devices',
    subjects: ['Chip maker', 'Software startup', 'Cloud provider', 'Phone maker', 'Robotics lab', 'Open-source group', 'Browser team', 'Security researchers'],
    actions: ['unveils faster processor', 'patches critical flaw', 'launches privacy dashboard', 'doubles battery life in new model', 'releases open data toolkit', 'tests voice assistant upgrade'],
  },
  Science: {
    topic: 'climate research',
    subjects: ['Marine biologists', 'Space agency', 'Physics team', 'Climate scientists', 'Geology survey', 'Medical researchers', 'Botany institute', 'Astronomy group'],
    actions: ['discover new deep-sea species', 'confirm record ice loss', 'map distant galaxy cluster', 'publish soil carbon study', 'detect unusual radio signal', 'grow drought-resistant crop'],
  },
  Sports: {
    topic: 'league play',
    subjects: ['Home side', 'Veteran captain', 'Youth academy', 'Marathon runner', 'Women’s team', 'Relay squad', 'Cricket club', 'Swim champion'],
    actions: ['clinches title in overtime', 'signs landmark contract', 'breaks national record', 'recovers from late injury', 'stuns favourites in final', 'announces retirement after season'],
  },
  Health: {
    topic: 'hospital care',
    subjects: ['Public hospital', 'Health ministry', 'Clinical trial', 'Rural clinic', 'Nutrition study', 'Vaccine programme', 'Sleep researchers', 'Pharmacy network'],
    actions: ['expands free screening', 'reports shorter waiting times', 'launches mobile care unit', 'finds benefit in daily walking', 'updates winter guidance', 'trains hundreds of new nurses'],
  },
}

const SUMMARY_FRAMES = [
  (t) => `Officials and analysts say the move could have a lasting effect on ${t} over the next year.`,
  (t) => `Reaction was mixed, with supporters pointing to gains for ${t} and critics urging caution.`,
  (t) => `The announcement follows months of debate and is expected to affect ${t} across the region.`,
  (t) => `Early figures suggest a measurable shift in ${t}, though experts say it is too soon to be sure.`,
  (t) => `Observers called it a turning point for ${t}, with further details due in the coming weeks.`,
]

// mulberry32: tiny seeded PRNG so the output is identical on every run
function rng(seed) {
  let a = seed
  return () => {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = rng(84718)
const pick = (list) => list[Math.floor(random() * list.length)]
const shuffle = (list) => {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const NEWEST = Date.parse('2026-10-14T12:00:00Z')
const SPAN_MINUTES = 90 * 24 * 60

const articles = []
for (const [category, { topic, subjects, actions }] of Object.entries(CATEGORIES)) {
  const combos = shuffle(subjects.flatMap((subject) => actions.map((action) => `${subject} ${action}`)))
  for (const title of combos.slice(0, PER_CATEGORY)) {
    const minutesAgo = Math.floor(random() * SPAN_MINUTES)
    articles.push({
      title,
      summary: pick(SUMMARY_FRAMES)(topic),
      category,
      publishedAt: new Date(NEWEST - minutesAgo * 60_000).toISOString(),
    })
  }
}

const result = shuffle(articles).map((article, index) => ({
  id: `art-${String(index + 1).padStart(3, '0')}`,
  ...article,
}))

writeFileSync(new URL('../public/articles.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`)
console.log(`Wrote ${result.length} articles`)
