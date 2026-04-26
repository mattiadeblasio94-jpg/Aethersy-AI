/**
 * AETHERSY AI - Cinema Studio Routes
 */

const express = require('express');
const router = express.Router();
const cinema = require('../services/cinema');

/**
 * POST /api/cinema/generate-video
 * Generate video from prompt
 */
router.post('/generate-video', async (req, res, next) => {
  try {
    const { userId, prompt, duration = 5, aspectRatio = '16:9', style = 'cinematic' } = req.body;

    if (!userId || !prompt) {
      return res.status(400).json({ error: 'userId and prompt are required' });
    }

    const result = await cinema.generateVideo({ userId, prompt, duration, aspectRatio, style });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cinema/status/:videoId
 * Get video generation status
 */
router.get('/status/:videoId', async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const status = await cinema.getVideoStatus(videoId);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cinema/generate-image
 * Generate image from prompt
 */
router.post('/generate-image', async (req, res, next) => {
  try {
    const { userId, prompt, width = 1920, height = 1080, style = 'photorealistic' } = req.body;

    if (!userId || !prompt) {
      return res.status(400).json({ error: 'userId and prompt are required' });
    }

    const result = await cinema.generateImage({ userId, prompt, width, height, style });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cinema/generate-voice
 * Generate voice from text
 */
router.post('/generate-voice', async (req, res, next) => {
  try {
    const { text, voiceId = 'Lara' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const audioBuffer = await cinema.generateVoice(text, voiceId);

    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cinema/storyboard
 * Create storyboard from shots sequence
 */
router.post('/storyboard', async (req, res, next) => {
  try {
    const { userId, shots } = req.body;

    if (!userId || !shots || !Array.isArray(shots)) {
      return res.status(400).json({ error: 'userId and shots array are required' });
    }

    const result = await cinema.createStoryboard(userId, shots);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cinema/colorgrade
 * Apply color grading to video
 */
router.post('/colorgrade', async (req, res, next) => {
  try {
    const { inputPath, preset, customSettings } = req.body;

    if (!inputPath) {
      return res.status(400).json({ error: 'inputPath is required' });
    }

    const settings = customSettings || cinema.getColorGradePreset(preset || 'neutral');
    const outputPath = inputPath.replace('.', '_graded.');

    const result = await cinema.applyColorGrade(inputPath, settings, outputPath);
    res.json({ outputPath: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/cinema/extract-frames
 * Extract frames from video
 */
router.post('/extract-frames', async (req, res, next) => {
  try {
    const { videoPath, interval = 1, outputDir } = req.body;

    if (!videoPath || !outputDir) {
      return res.status(400).json({ error: 'videoPath and outputDir are required' });
    }

    const frames = await cinema.extractFrames(videoPath, interval, outputDir);
    res.json({ frames });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cinema/presets
 * Get available presets
 */
router.get('/presets', async (req, res, next) => {
  try {
    const presets = {
      colorGrading: {
        cinematic: { temperature: 6500, contrast: 1.2, saturation: 0.9 },
        warm: { temperature: 7500, contrast: 1.0, saturation: 1.1 },
        cool: { temperature: 5500, contrast: 1.1, saturation: 0.95 },
        noir: { temperature: 6000, contrast: 1.5, saturation: 0 },
        vivid: { temperature: 6500, contrast: 1.1, saturation: 1.3 },
        neutral: { temperature: 6500, contrast: 1.0, saturation: 1.0 }
      },
      aspectRatios: {
        '16:9': { width: 1920, height: 1080, name: 'Landscape' },
        '9:16': { width: 1080, height: 1920, name: 'Portrait (Stories)' },
        '1:1': { width: 1080, height: 1080, name: 'Square' },
        '4:5': { width: 1080, height: 1350, name: 'Instagram' },
        '21:9': { width: 2560, height: 1080, name: 'Ultrawide' }
      },
      voices: [
        { id: 'Lara', name: 'Lara (AI Assistant)', gender: 'female' },
        { id: 'Marco', name: 'Marco (Narrator)', gender: 'male' },
        { id: 'Giulia', name: 'Giulia (Friendly)', gender: 'female' }
      ]
    };

    res.json(presets);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
