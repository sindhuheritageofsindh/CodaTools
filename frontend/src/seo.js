import { tools } from './data'

const SITE_NAME = 'CodaTools'
const DEFAULT_DESCRIPTION = 'Free online tools for images, PDFs, QR codes, text and developer workflows. Fast, private and easy to use.'
const DEFAULT_TITLE = 'CodaTools — Free Online Image, PDF, QR & Developer Tools'

function ensureMeta(selector, attrs) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value))
    document.head.appendChild(el)
  }
  return el
}

function ensureLink(rel) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  return el
}

function absoluteUrl(pathname = '/') {
  return new URL(pathname, window.location.origin).href
}

export function setSeo(tool = null) {
  const title = tool?.seoTitle || DEFAULT_TITLE
  const description = tool?.seoDescription || DEFAULT_DESCRIPTION
  const canonicalPath = tool ? `/tools/${tool.slug}` : '/'
  const canonical = absoluteUrl(canonicalPath)
  const keywords = tool?.keywords || 'online tools, image tools, pdf tools, qr code tools, developer tools'

  document.title = title
  ensureMeta('meta[name="description"]', { name: 'description' }).content = description
  ensureMeta('meta[name="keywords"]', { name: 'keywords' }).content = keywords
  ensureMeta('meta[name="robots"]', { name: 'robots' }).content = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
  ensureMeta('meta[property="og:title"]', { property: 'og:title' }).content = title
  ensureMeta('meta[property="og:description"]', { property: 'og:description' }).content = description
  ensureMeta('meta[property="og:type"]', { property: 'og:type' }).content = 'website'
  ensureMeta('meta[property="og:site_name"]', { property: 'og:site_name' }).content = SITE_NAME
  ensureMeta('meta[property="og:url"]', { property: 'og:url' }).content = canonical
  ensureMeta('meta[name="twitter:card"]', { name: 'twitter:card' }).content = 'summary_large_image'
  ensureMeta('meta[name="twitter:title"]', { name: 'twitter:title' }).content = title
  ensureMeta('meta[name="twitter:description"]', { name: 'twitter:description' }).content = description
  ensureLink('canonical').href = canonical

  const existing = document.getElementById('codatools-jsonld')
  if (existing) existing.remove()

  const schema = tool
    ? {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: tool.name,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        url: canonical,
        description,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        isAccessibleForFree: true,
        browserRequirements: 'Requires JavaScript',
        publisher: { '@type': 'Organization', name: SITE_NAME, url: absoluteUrl('/') },
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: absoluteUrl('/'),
        description,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${absoluteUrl('/')}?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }

  const script = document.createElement('script')
  script.id = 'codatools-jsonld'
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(schema)
  document.head.appendChild(script)
}

export function toolPath(tool) {
  return `/tools/${tool.slug}`
}

export function navigate(path) {
  if (window.location.pathname !== path) window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function findToolFromLocation() {
  const match = window.location.pathname.match(/^\/tools\/([^/]+)\/?$/)
  if (!match) return null
  return tools.find((tool) => tool.slug === decodeURIComponent(match[1])) || null
}
