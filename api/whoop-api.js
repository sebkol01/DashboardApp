export default async function handler(req, res) {
  const path = req.url.replace('/api/whoop-api', '')
  const upstream = `https://api.prod.whoop.com/developer/v1${path}`

  const upstreamRes = await fetch(upstream, {
    method: req.method,
    headers: {
      Authorization: req.headers.authorization || '',
      'Content-Type': req.headers['content-type'] || 'application/json',
    },
  })

  const data = await upstreamRes.text()
  res.status(upstreamRes.status).setHeader('Content-Type', 'application/json').send(data)
}
