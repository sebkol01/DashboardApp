export default async (req) => {
  const url = new URL(req.url)
  const path = url.pathname.replace('/.netlify/functions/whoop-api', '')
  const upstream = `https://api.prod.whoop.com/developer/v1${path}${url.search}`

  const res = await fetch(upstream, {
    method: req.method,
    headers: {
      Authorization: req.headers.get('Authorization') || '',
      'Content-Type': req.headers.get('Content-Type') || 'application/json',
    },
  })

  const data = await res.text()
  return new Response(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const config = { path: '/api/whoop-api/*' }
