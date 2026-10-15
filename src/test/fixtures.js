export const ANALYTICS_MESSAGE = '[Analytics] User interacted with Performance Optimization'

export const XSS_PAYLOAD = '<script>alert(1)</script>'

// Titles deliberately avoid overlapping search words so each query is unambiguous.
export const ARTICLES = [
  { id: 'a1', title: 'Senate passes climate bill', summary: 'Lawmakers approved sweeping emissions rules after a late vote.', category: 'Politics', publishedAt: '2026-10-10T09:00:00Z' },
  { id: 'a2', title: 'Local team wins championship', summary: 'Fans filled the streets after a dramatic overtime finish.', category: 'Sports', publishedAt: '2026-10-12T21:00:00Z' },
  { id: 'a3', title: 'New chip doubles battery life', summary: 'Engineers unveiled a processor that sips power.', category: 'Tech', publishedAt: '2026-10-14T08:00:00Z' },
  { id: 'a4', title: 'Election results delayed', summary: 'Officials cite recounts in several counties.', category: 'Politics', publishedAt: '2026-10-08T12:00:00Z' },
  { id: 'a5', title: 'Startup raises record funding', summary: 'The round values the company at a record sum.', category: 'Tech', publishedAt: '2026-10-13T15:00:00Z' },
  { id: 'a6', title: 'Marathon record broken', summary: 'A runner shaved minutes off the previous best.', category: 'Sports', publishedAt: '2026-10-01T07:00:00Z' },
]

export const TITLES_NEWEST_FIRST = [
  'New chip doubles battery life',
  'Startup raises record funding',
  'Local team wins championship',
  'Senate passes climate bill',
  'Election results delayed',
  'Marathon record broken',
]
export const TITLES_OLDEST_FIRST = [...TITLES_NEWEST_FIRST].reverse()
export const TITLES_A_TO_Z = [
  'Election results delayed',
  'Local team wins championship',
  'Marathon record broken',
  'New chip doubles battery life',
  'Senate passes climate bill',
  'Startup raises record funding',
]

export const VALID_STORY = {
  title: 'Council meets behind closed doors',
  email: 'priya@example.com',
  summary: 'The council is meeting behind closed doors tonight to discuss the budget.',
}
