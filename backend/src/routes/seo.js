/**
 * AETHERSY AI - SEO Tools Routes
 */

const express = require('express');
const router = express.Router();
const seo = require('../services/seo');

/**
 * POST /api/seo/analyze-serp
 * Analyze SERP for keyword
 */
router.post('/analyze-serp', async (req, res, next) => {
  try {
    const { keyword, country = 'IT' } = req.body;

    if (!keyword) {
      return res.status(400).json({ error: 'keyword is required' });
    }

    const results = await seo.analyzeSERP(keyword, country);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/seo/keyword-research
 * Keyword research with volumes
 */
router.post('/keyword-research', async (req, res, next) => {
  try {
    const { seedKeyword, country = 'IT' } = req.body;

    if (!seedKeyword) {
      return res.status(400).json({ error: 'seedKeyword is required' });
    }

    const keywords = await seo.keywordResearch(seedKeyword, country);
    res.json({ keywords });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/seo/generate-schema
 * Generate Schema.org markup
 */
router.post('/generate-schema', async (req, res, next) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ error: 'data is required' });
    }

    const schema = await seo.generateSchemaMarkup(data);
    res.json({ schema });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/seo/analyze-onpage
 * On-page SEO analysis
 */
router.post('/analyze-onpage', async (req, res, next) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const report = await seo.analyzeOnPage(url);
    res.json(report);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/seo/analyze-competitor
 * Competitor analysis
 */
router.post('/analyze-competitor', async (req, res, next) => {
  try {
    const { domain, country = 'IT' } = req.body;

    if (!domain) {
      return res.status(400).json({ error: 'domain is required' });
    }

    const analysis = await seo.analyzeCompetitor(domain, country);
    res.json(analysis);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/seo/full-report
 * Generate comprehensive SEO report
 */
router.post('/full-report', async (req, res, next) => {
  try {
    const { domain, keywords, country = 'IT' } = req.body;

    if (!domain || !keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: 'domain and keywords array are required' });
    }

    const report = await seo.generateFullReport({ domain, keywords, country });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/seo/schema-templates
 * Get Schema.org templates
 */
router.get('/schema-templates', async (req, res, next) => {
  try {
    const templates = {
      organization: {
        '@type': 'Organization',
        name: 'Your Company Name',
        url: 'https://yourdomain.com',
        logo: 'https://yourdomain.com/logo.png',
        sameAs: [
          'https://facebook.com/yourpage',
          'https://twitter.com/yourhandle',
          'https://linkedin.com/company/yourcompany'
        ]
      },
      website: {
        '@type': 'WebSite',
        name: 'Your Site Name',
        url: 'https://yourdomain.com',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://yourdomain.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      },
      article: {
        '@type': 'Article',
        headline: 'Article Title',
        image: ['https://yourdomain.com/image.jpg'],
        datePublished: '2026-01-01T00:00:00+00:00',
        dateModified: '2026-01-01T00:00:00+00:00',
        author: {
          '@type': 'Person',
          name: 'Author Name',
          url: 'https://yourdomain.com/author'
        }
      },
      product: {
        '@type': 'Product',
        name: 'Product Name',
        image: 'https://yourdomain.com/product.jpg',
        description: 'Product description',
        brand: {
          '@type': 'Brand',
          name: 'Brand Name'
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'EUR',
          price: '99.00',
          availability: 'https://schema.org/InStock'
        }
      },
      faqPage: {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Frequently Asked Question?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Answer to the question.'
            }
          }
        ]
      },
      localBusiness: {
        '@type': 'LocalBusiness',
        name: 'Business Name',
        image: 'https://yourdomain.com/image.jpg',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Via Roma 1',
          addressLocality: 'Milano',
          postalCode: '20100',
          addressCountry: 'IT'
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 45.4642,
          longitude: 9.1900
        },
        telephone: '+39 02 1234567',
        openingHours: 'Mo-Fr 09:00-18:00'
      }
    };

    res.json(templates);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
