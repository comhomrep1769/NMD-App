import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://nmdpowash.com'
  const now = new Date()

  return [
    { url: base,                             lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: base + '/client/request-service', lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: base + '/client/register',        lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: base + '/mission',                lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: base + '/join-our-team',          lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: base + '/client/login',           lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: base + '/employee/login',         lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ]
}
