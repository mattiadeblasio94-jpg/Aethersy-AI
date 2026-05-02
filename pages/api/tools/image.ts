/**
 * Image AI API - Text-to-Image, Image-to-Text, Editing
 * Supporta Replicate, Groq Vision, Alibaba Cloud
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const ALIBABA_API_KEY = process.env.ALIBABA_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      // ============================================
      // TEXT-TO-IMAGE (Generazione immagini)
      // ============================================
      case 'generate':
        return generateImage(req, res);

      // ============================================
      // IMAGE-TO-TEXT (Analisi immagini)
      // ============================================
      case 'analyze':
        return analyzeImage(req, res);

      // ============================================
      // IMAGE EDITING
      // ============================================
      case 'upscale':
        return upscaleImage(req, res);

      case 'remove-background':
        return removeBackground(req, res);

      case 'style-transfer':
        return styleTransfer(req, res);

      // ============================================
      // LOGO & BRANDING
      // ============================================
      case 'generate-logo':
        return generateLogo(req, res);

      default:
        res.status(400).json({
          error: 'Azione non valida',
          availableActions: [
            'generate', 'analyze', 'upscale',
            'remove-background', 'style-transfer', 'generate-logo'
          ]
        });
    }
  } catch (error: any) {
    console.error('Image API error:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// TEXT-TO-IMAGE - Replicate SDXL / DALL-E 3
// ============================================

async function generateImage(req: NextApiRequest, res: NextApiResponse) {
  const { prompt, model = 'sdxl', size = '1024x1024', style = 'photorealistic', negativePrompt = '' } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt richiesto' });
  }

  // Style presets
  const stylePrompts: Record<string, string> = {
    photorealistic: 'photorealistic, highly detailed, professional photography, 8k, ultra realistic',
    artistic: 'artistic painting, oil painting style, artistic interpretation, masterpiece',
    anime: 'anime style, manga, studio ghibli, anime art, japanese animation',
    '3d-render': '3d render, octane render, unreal engine, cinematic lighting, hyperdetailed',
    minimal: 'minimalist design, clean, simple, modern, flat design',
    vintage: 'vintage style, retro, film photography, nostalgic, aged',
    cyberpunk: 'cyberpunk, neon lights, futuristic, sci-fi, blade runner style',
    watercolor: 'watercolor painting, soft colors, artistic, hand-painted look'
  };

  const fullPrompt = `${prompt}, ${stylePrompts[style] || ''}`;

  // Replicate API - SDXL Turbo
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: '39ed52f2a78e934b3ba6e2a4872c7d7b28e0375978d9e3138a43f474245514ca8d3d5f5b4be730c6b78d56066d9128d8b4ec52cba3e1f24322726103a03f94e4',
      input: {
        prompt: fullPrompt,
        negative_prompt: negativePrompt || 'ugly, blurry, low quality, distorted',
        width: parseInt(size.split('x')[0]),
        height: parseInt(size.split('x')[1]),
        num_outputs: 1,
        num_inference_steps: 4, // SDXL Turbo - fast generation
        guidance_scale: 2.5
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Replicate error: ${response.statusText}`);
  }

  const prediction = await response.json();

  // Poll per risultato
  let result = prediction;
  while (result.status === 'processing' || result.status === 'starting') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pollResponse = await fetch(result.urls.get, {
      headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
    });
    result = await pollResponse.json();
  }

  if (result.status === 'failed') {
    throw new Error('Image generation failed');
  }

  res.json({
    success: true,
    imageUrl: result.output?.[0] || result.output,
    prompt: fullPrompt,
    model,
    style,
    size,
    seed: result.input?.seed
  });
}

// ============================================
// IMAGE-TO-TEXT - Groq Vision / LLaVA
// ============================================

async function analyzeImage(req: NextApiRequest, res: NextApiResponse) {
  const { imageUrl, task = 'caption', language = 'it' } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl richiesto' });
  }

  // Task descriptions
  const taskPrompts: Record<string, string> = {
    caption: 'Describe this image in detail in Italian.',
    ocr: 'Extract all text from this image. Return only the text content.',
    'object-detection': 'List all objects visible in this image with their locations.',
    'scene-understanding': 'Analyze this image: describe the scene, context, mood, and any actions happening.',
    'accessibility': 'Generate an alt-text description for accessibility purposes.',
    'content-moderation': 'Check if this image contains any inappropriate content. List any concerns.',
    'product-analysis': 'Analyze this product image: describe features, quality, potential use cases.',
    'chart-analysis': 'Analyze this chart/graph: extract data points, trends, and key insights.'
  };

  // Groq API con LLaVA (vision model)
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llava-v1.5-7b-4096-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: taskPrompts[task] || taskPrompts.caption },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 1024,
      language: language
    })
  });

  if (!response.ok) {
    throw new Error(`Groq Vision error: ${response.statusText}`);
  }

  const data = await response.json();

  res.json({
    success: true,
    analysis: data.choices?.[0]?.message?.content,
    task,
    language,
    model: 'llava-v1.5-7b'
  });
}

// ============================================
// IMAGE UPSCALING - Replicate Real-ESRGAN
// ============================================

async function upscaleImage(req: NextApiRequest, res: NextApiResponse) {
  const { imageUrl, scale = 4, faceEnhance = true } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl richiesto' });
  }

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: '42fed1c4974146d4d2414e2be2c5277c79f04d78a466d531da4e9589a8e581e9',
      input: {
        image: imageUrl,
        scale: scale,
        face_enhance: faceEnhance
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Replicate error: ${response.statusText}`);
  }

  const prediction = await response.json();

  // Poll per risultato
  let result = prediction;
  while (result.status === 'processing' || result.status === 'starting') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pollResponse = await fetch(result.urls.get, {
      headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
    });
    result = await pollResponse.json();
  }

  res.json({
    success: true,
    upscaledUrl: result.output,
    originalUrl: imageUrl,
    scale,
    faceEnhanced: faceEnhance
  });
}

// ============================================
// BACKGROUND REMOVAL - Replicate RMBG
// ============================================

async function removeBackground(req: NextApiRequest, res: NextApiResponse) {
  const { imageUrl, outputFormat = 'png' } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl richiesto' });
  }

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: '7561d6d758f6e4e84f0c1eb8f5c8c7f8e5b5e5b5e5b5e5b5e5b5e5b5e5b5e5b5',
      input: {
        image: imageUrl
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Replicate error: ${response.statusText}`);
  }

  const prediction = await response.json();

  let result = prediction;
  while (result.status === 'processing' || result.status === 'starting') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pollResponse = await fetch(result.urls.get, {
      headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
    });
    result = await pollResponse.json();
  }

  res.json({
    success: true,
    noBgUrl: result.output,
    originalUrl: imageUrl,
    format: outputFormat
  });
}

// ============================================
// STYLE TRANSFER - Neural Style Transfer
// ============================================

async function styleTransfer(req: NextApiRequest, res: NextApiResponse) {
  const { imageUrl, style = 'impressionist', intensity = 0.7 } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl richiesto' });
  }

  // Style presets
  const styleImages: Record<string, string> = {
    impressionist: 'https://example.com/styles/impressionist.jpg',
    'van-gogh': 'https://example.com/styles/vangogh.jpg',
    'picasso': 'https://example.com/styles/picasso.jpg',
    'art-nouveau': 'https://example.com/styles/artnouveau.jpg',
    'pop-art': 'https://example.com/styles/popart.jpg',
    'watercolor': 'https://example.com/styles/watercolor.jpg',
    'sketch': 'https://example.com/styles/sketch.jpg',
    'cyberpunk': 'https://example.com/styles/cyberpunk.jpg'
  };

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: '80537f7a0c0e3e8a4c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c3c',
      input: {
        content_image: imageUrl,
        style_image: styleImages[style] || styleImages.impressionist,
        style_strength: intensity
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Replicate error: ${response.statusText}`);
  }

  const prediction = await response.json();

  let result = prediction;
  while (result.status === 'processing' || result.status === 'starting') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pollResponse = await fetch(result.urls.get, {
      headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
    });
    result = await pollResponse.json();
  }

  res.json({
    success: true,
    styledUrl: result.output,
    originalUrl: imageUrl,
    style,
    intensity
  });
}

// ============================================
// LOGO GENERATION - Specialized AI
// ============================================

async function generateLogo(req: NextApiRequest, res: NextApiResponse) {
  const {
    companyName,
    industry = 'tech',
    style = 'modern',
    colors = ['primary', 'secondary'],
    symbols = []
  } = req.body;

  if (!companyName) {
    return res.status(400).json({ error: 'companyName richiesto' });
  }

  // Industry-specific prompts
  const industryPrompts: Record<string, string> = {
    tech: 'technology, innovation, digital, modern, sleek',
    food: 'food, restaurant, culinary, delicious, fresh',
    fashion: 'fashion, style, elegant, trendy, luxury',
    health: 'health, wellness, medical, care, trust',
    finance: 'finance, money, trust, professional, secure',
    education: 'education, learning, knowledge, growth',
    realEstate: 'real estate, property, home, building',
    automotive: 'automotive, car, speed, power, luxury'
  };

  // Style modifiers
  const styleModifiers: Record<string, string> = {
    modern: 'minimalist, clean, contemporary, geometric',
    vintage: 'vintage, retro, classic, timeless',
    playful: 'playful, fun, colorful, friendly',
    luxury: 'luxury, premium, elegant, sophisticated',
    bold: 'bold, strong, impactful, dynamic',
    organic: 'organic, natural, flowing, eco-friendly'
  };

  const prompt = `
    Professional logo design for "${companyName}",
    ${industryPrompts[industry] || ''},
    ${styleModifiers[style] || ''},
    ${symbols.length > 0 ? `symbols: ${symbols.join(', ')}` : ''},
    vector, minimalist, white background, high contrast
  `.trim();

  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      version: '39ed52f2a78e934b3ba6e2a4872c7d7b28e0375978d9e3138a43f474245514ca',
      input: {
        prompt,
        width: 1024,
        height: 1024,
        num_outputs: 4, // Genera 4 varianti
        guidance_scale: 7.5
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Replicate error: ${response.statusText}`);
  }

  const prediction = await response.json();

  let result = prediction;
  while (result.status === 'processing' || result.status === 'starting') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pollResponse = await fetch(result.urls.get, {
      headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
    });
    result = await pollResponse.json();
  }

  res.json({
    success: true,
    logos: result.output || [],
    companyName,
    industry,
    style,
    colors,
    prompt
  });
}
