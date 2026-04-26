/**
 * AETHERSY AI - SEO Tools Service
 * Keyword research, SERP analysis, Schema markup
 */

const axios = require('axios');
const ollama = require('./ollama');

class SEOService {
  constructor() {
    this.serperApiKey = process.env.SERPER_API_KEY;
    this.semrushApiKey = process.env.SEMRUSH_API_KEY;
    this.ahrefsApiKey = process.env.AHREFS_API_KEY;
  }

  /**
   * Analisi SERP per keyword
   * @param {string} keyword - Keyword da analizzare
   * @param {string} country - Codice paese (IT, US, etc.)
   * @returns {Promise<object>} - Risultati SERP
   */
  async analyzeSERP(keyword, country = 'IT') {
    try {
      const response = await axios.post(
        'https://google.serper.dev/search',
        {
          q: keyword,
          gl: country.toLowerCase(),
          hl: country.toLowerCase(),
          num: 20
        },
        {
          headers: {
            'X-API-KEY': this.serperApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const results = response.data;

      // Estrai dati strutturati
      const serpAnalysis = {
        keyword,
        country,
        totalResults: results.searchParameters?.totalResults || 0,
        timeTaken: results.searchParameters?.timeTaken || 0,
        organicResults: results.organic?.length || 0,
        peopleAlsoAsk: results.peopleAlsoAsk?.length || 0,
        relatedSearches: results.relatedSearches?.length || 0,
        topDomains: (results.organic || []).slice(0, 10).map(r => ({
          position: r.position,
          domain: this.extractDomain(r.link),
          title: r.title,
          snippet: r.snippet
        })),
        featured: results.answerBox || results.knowledgeGraph || null,
        analyzedAt: new Date().toISOString()
      };

      return serpAnalysis;
    } catch (err) {
      console.error('SERP analysis error:', err.message);
      throw new Error(`SERP analysis failed: ${err.message}`);
    }
  }

  /**
   * Keyword research con volumi e difficoltà
   * @param {string} seedKeyword - Keyword seed
   * @param {string} country - Codice paese
   * @returns {Promise<Array>} - Keywords correlate
   */
  async keywordResearch(seedKeyword, country = 'IT') {
    try {
      // Usa Serper per trovare keyword correlate
      const response = await axios.post(
        'https://google.serper.dev/autocomplete',
        {
          q: seedKeyword,
          gl: country.toLowerCase()
        },
        {
          headers: {
            'X-API-KEY': this.serperApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const keywords = (response.data.autocomplete || []).map(k => ({
        keyword: k,
        seed: seedKeyword,
        type: 'autocomplete'
      }));

      // Genera stime con Ollama
      const enhancedKeywords = await Promise.all(
        keywords.map(async (k) => {
          const estimation = await this.estimateKeywordMetrics(k.keyword, seedKeyword);
          return {
            ...k,
            ...estimation
          };
        })
      );

      return enhancedKeywords.sort((a, b) => b.estimatedVolume - a.estimatedVolume);
    } catch (err) {
      console.error('Keyword research error:', err.message);
      throw new Error(`Keyword research failed: ${err.message}`);
    }
  }

  /**
   * Stima metriche keyword con AI
   * @param {string} keyword - Keyword
   * @param {string} seed - Keyword seed
   * @returns {Promise<object>} - Metriche stimate
   */
  async estimateKeywordMetrics(keyword, seed) {
    try {
      const prompt = `Stima le seguenti metriche SEO per la keyword "${keyword}" (seed: "${seed}").
      Rispondi SOLO con JSON valido:
      {
        "estimatedVolume": numero (ricerche mensili stimate),
        "difficulty": numero 0-100,
        "cpc": numero (costo per click stimato in EUR),
        "intent": "informational|navigational|commercial|transactional",
        "trend": "rising|stable|declining"
      }

      Considera:
      - Lunghezza keyword (più lunga = meno volume, più specifico)
      - Presenza di parole commerciali ("comprare", "prezzo", "miglior")
      - Specificità del termine`;

      const response = await ollama.chat(prompt, [], false);

      // Estrai JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Default values
      return {
        estimatedVolume: Math.floor(Math.random() * 1000) + 100,
        difficulty: Math.floor(Math.random() * 50) + 25,
        cpc: parseFloat((Math.random() * 2).toFixed(2)),
        intent: 'informational',
        trend: 'stable'
      };
    } catch (err) {
      console.error('Keyword estimation error:', err.message);
      return {
        estimatedVolume: 500,
        difficulty: 50,
        cpc: 1.0,
        intent: 'informational',
        trend: 'stable'
      };
    }
  }

  /**
   * Genera Schema Markup JSON-LD
   * @param {object} data - Dati per schema
   * @returns {Promise<object>} - Schema markup
   */
  async generateSchemaMarkup(data) {
    try {
      const prompt = `Genera uno schema.org JSON-LD markup valido con i seguenti dati:
      ${JSON.stringify(data, null, 2)}

      Includi tutti gli schema rilevanti:
      - Organization
      - WebSite
      - BreadcrumbList
      - Article (se applicabile)
      - Product (se applicabile)
      - FAQPage (se applicabile)

      Rispondi SOLO con JSON valido, niente altro.`;

      const response = await ollama.chat(prompt, [], false);

      // Estrai JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const schema = JSON.parse(jsonMatch[0]);

        // Aggiungi contesto JSON-LD
        return {
          '@context': 'https://schema.org',
          '@graph': Array.isArray(schema) ? schema : [schema]
        };
      }

      throw new Error('No valid JSON in response');
    } catch (err) {
      console.error('Schema generation error:', err.message);
      throw new Error(`Schema markup generation failed: ${err.message}`);
    }
  }

  /**
   * Analisi SEO on-page di una pagina
   * @param {string} url - URL da analizzare
   * @returns {Promise<object>} - Report SEO
   */
  async analyzeOnPage(url) {
    try {
      // Fetch pagina con Serper
      const response = await axios.post(
        'https://google.serper.dev/search',
        {
          q: `site:${url}`,
          num: 1
        },
        {
          headers: {
            'X-API-KEY': this.serperApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const pageData = response.data.organic?.[0] || {};

      // Analisi con Ollama
      const analysisPrompt = `Analizza questa pagina web per SEO on-page:
      URL: ${url}
      Titolo: ${pageData.title || 'N/A'}
      Descrizione: ${pageData.snippet || 'N/A'}

      Valuta (1-10) e fornisci raccomandazioni per:
      1. Title tag optimization
      2. Meta description
      3. Content quality
      4. Keyword usage
      5. Readability

      Rispondi con JSON:
      {
        "scores": { "title": 1-10, "metaDescription": 1-10, "content": 1-10, "keywords": 1-10, "readability": 1-10 },
        "overallScore": 1-100,
        "recommendations": ["raccomandazione 1", "raccomandazione 2"],
        "issues": ["problema 1", "problema 2"]
      }`;

      const analysis = await ollama.chat(analysisPrompt, [], false);
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);

      const seoReport = {
        url,
        analyzedAt: new Date().toISOString(),
        pageData,
        analysis: jsonMatch ? JSON.parse(jsonMatch[0]) : null
      };

      return seoReport;
    } catch (err) {
      console.error('On-page analysis error:', err.message);
      throw new Error(`On-page analysis failed: ${err.message}`);
    }
  }

  /**
   * Analisi competitor
   * @param {string} domain - Dominio da analizzare
   * @param {string} country - Codice paese
   * @returns {Promise<object>} - Analisi competitor
   */
  async analyzeCompetitor(domain, country = 'IT') {
    try {
      // Cerca menzioni del competitor
      const response = await axios.post(
        'https://google.serper.dev/search',
        {
          q: `site:${domain}`,
          num: 20,
          gl: country.toLowerCase()
        },
        {
          headers: {
            'X-API-KEY': this.serperApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const results = response.data.organic || [];

      // Estrai pattern
      const topPages = results.slice(0, 10).map(r => ({
        url: r.link,
        title: r.title,
        snippet: r.snippet
      }));

      // Analisi AI
      const analysisPrompt = `Analizza questo competitor: ${domain}

      Pagine top:
      ${topPages.map(p => `- ${p.title}: ${p.snippet}`).join('\n')}

      Identifica:
      1. Primary keywords target
      2. Content strategy
      3. Unique value proposition
      4. Potential weaknesses

      Rispondi con JSON:
      {
        "primaryKeywords": ["keyword1", "keyword2"],
        "contentStrategy": "descrizione",
        "uniqueValue": "descrizione",
        "weaknesses": ["debolezza 1", "debolezza 2"],
        "opportunities": ["opportunità 1", "opportunità 2"]
      }`;

      const analysis = await ollama.chat(analysisPrompt, [], false);
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);

      return {
        domain,
        country,
        analyzedAt: new Date().toISOString(),
        topPages,
        analysis: jsonMatch ? JSON.parse(jsonMatch[0]) : null,
        totalIndexedPages: results.length
      };
    } catch (err) {
      console.error('Competitor analysis error:', err.message);
      throw new Error(`Competitor analysis failed: ${err.message}`);
    }
  }

  /**
   * Estrae dominio da URL
   * @param {string} url - URL completo
   * @returns {string} - Dominio
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  /**
   * Genera report SEO completo
   * @param {object} params - Parametri report
   * @returns {Promise<object>} - Report completo
   */
  async generateFullReport({ domain, keywords, country = 'IT' }) {
    const report = {
      domain,
      country,
      generatedAt: new Date().toISOString(),
      sections: {}
    };

    // 1. SERP Analysis per keyword principali
    report.sections.serpAnalysis = await Promise.all(
      keywords.slice(0, 5).map(kw => this.analyzeSERP(kw, country))
    );

    // 2. Keyword research
    const allKeywords = [];
    for (const kw of keywords.slice(0, 3)) {
      const related = await this.keywordResearch(kw, country);
      allKeywords.push(...related.slice(0, 10));
    }
    report.sections.keywordOpportunities = allKeywords.sort((a, b) => b.estimatedVolume - a.estimatedVolume).slice(0, 30);

    // 3. Competitor analysis
    const topCompetitors = report.sections.serpAnalysis
      .flatMap(s => s.topDomains || [])
      .map(d => d.domain)
      .filter((d, i, arr) => arr.indexOf(d) === i && d !== domain)
      .slice(0, 3);

    report.sections.competitors = await Promise.all(
      topCompetitors.map(c => this.analyzeCompetitor(c, country))
    );

    // 4. Schema markup suggestion
    report.sections.schemaMarkup = await this.generateSchemaMarkup({
      type: 'Organization',
      name: domain,
      url: `https://${domain}`
    });

    return report;
  }
}

module.exports = new SEOService();
