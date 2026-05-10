const PROXY = 'https://api.allorigins.win/get?url='

export async function fetchRSS(url) {
  const res = await fetch(`${PROXY}${encodeURIComponent(url)}`)
  if (!res.ok) throw new Error('Proxy fetch failed')
  const json = await res.json()
  const parser = new DOMParser()
  const doc = parser.parseFromString(json.contents, 'text/xml')
  const items = [...doc.querySelectorAll('item')]
  return items.map((item) => ({
    title: getText(item, 'title'),
    link: getText(item, 'link') || item.querySelector('link')?.textContent,
    description: stripHtml(
      getText(item, 'description') ||
        item.querySelector('content\\:encoded, encoded')?.textContent ||
        '',
    ),
    author:
      getText(item, 'author') ||
      getText(item, 'dc\\:creator') ||
      getText(item, 'creator') ||
      '',
    pubDate: getText(item, 'pubDate') || getText(item, 'published') || '',
    guid: getText(item, 'guid') || getText(item, 'link') || '',
  }))
}

function getText(parent, selector) {
  return parent.querySelector(selector)?.textContent?.trim() || ''
}

export function stripHtml(html) {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
