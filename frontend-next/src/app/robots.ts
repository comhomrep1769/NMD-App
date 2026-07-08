import { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin', '/employee', '/superadmin', '/client/', '/sales',
        '/dashboard', '/clientdashboard', '/invoices', '/quotes',
        '/clients', '/employees', '/expenses', '/payroll', '/mileage',
        '/bonus', '/schedule', '/routes', '/requests', '/recurring',
        '/treatments', '/photos', '/pricing', '/timeclock', '/applicants',
        '/chat', '/guru-training', '/site-content', '/availability',
      ],
    },
    sitemap: 'https://nmdpowash.com/sitemap.xml',
  }
}