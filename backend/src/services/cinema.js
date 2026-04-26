/**
 * AETHERSY AI - Cinema Studio Service
 * Generazione video, audio e montaggio automatico
 */

const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

class CinemaService {
  constructor() {
    this.replicateApiKey = process.env.REPLICATE_API_TOKEN;
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    this.uploadsDir = path.join(__dirname, '../../uploads');

    // Video generation models on Replicate
    this.models = {
      video: 'stability-ai/stable-video-diffusion:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea351df4979778f7e9332fd5ab',
      image: 'black-forest-labs/flux-pro-1.1:1920x1088',
      voice: 'elevenlabs/tts'
    };

    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Genera video da prompt
   * @param {object} params - Parametri generazione
   * @returns {Promise<object>} - Job creazione
   */
  async generateVideo({ userId, prompt, duration = 5, aspectRatio = '16:9', style = 'cinematic' }) {
    try {
      // Mappa aspect ratio a dimensioni
      const dimensions = this.getDimensions(aspectRatio);

      // Crea job su Replicate
      const response = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
          version: this.models.video,
          input: {
            prompt,
            video_length: duration,
            width: dimensions.width,
            height: dimensions.height,
            fps: 24,
            motion_bucket_id: 127
          }
        },
        {
          headers: {
            'Authorization': `Token ${this.replicateApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const prediction = response.data;

      // Salva stato in Redis (implementare con ioredis)
      const videoData = {
        id: prediction.id,
        userId,
        prompt,
        duration,
        aspectRatio,
        style,
        status: 'processing',
        createdAt: new Date().toISOString(),
        estimatedTime: 120 // secondi
      };

      console.log(`🎬 Video generation started: ${prediction.id}`);

      return {
        success: true,
        videoId: prediction.id,
        estimatedTime: videoData.estimatedTime,
        status: 'processing'
      };
    } catch (err) {
      console.error('Video generation error:', err.message);
      throw new Error(`Video generation failed: ${err.message}`);
    }
  }

  /**
   * Controlla stato generazione video
   * @param {string} videoId - ID video
   * @returns {Promise<object>} - Stato video
   */
  async getVideoStatus(videoId) {
    try {
      const response = await axios.get(
        `https://api.replicate.com/v1/predictions/${videoId}`,
        {
          headers: {
            'Authorization': `Token ${this.replicateApiKey}`
          }
        }
      );

      const prediction = response.data;

      return {
        id: prediction.id,
        status: prediction.status, // starting, processing, succeeded, failed
        output: prediction.output, // URL video quando completo
        error: prediction.error,
        createdAt: prediction.created_at,
        completedAt: prediction.completed_at
      };
    } catch (err) {
      console.error('Video status error:', err.message);
      throw new Error(`Status check failed: ${err.message}`);
    }
  }

  /**
   * Genera immagine da prompt
   * @param {object} params - Parametri
   * @returns {Promise<object>} - Immagine generata
   */
  async generateImage({ userId, prompt, width = 1920, height = 1080, style = 'photorealistic' }) {
    try {
      const response = await axios.post(
        'https://api.replicate.com/v1/predictions',
        {
          version: this.models.image,
          input: {
            prompt,
            width,
            height,
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 50
          }
        },
        {
          headers: {
            'Authorization': `Token ${this.replicateApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const prediction = response.data;

      return {
        success: true,
        imageId: prediction.id,
        status: 'processing',
        estimatedTime: 30
      };
    } catch (err) {
      console.error('Image generation error:', err.message);
      throw new Error(`Image generation failed: ${err.message}`);
    }
  }

  /**
   * Genera voce con ElevenLabs
   * @param {string} text - Testo da sintetizzare
   * @param {string} voiceId - ID voce (default: Lara)
   * @returns {Promise<Buffer>} - Audio buffer
   */
  async generateVoice(text, voiceId = 'Lara') {
    try {
      // Mappa voci Aethersy a ElevenLabs IDs
      const voiceMap = {
        'Lara': 'EXAVITQu4vr4xnSDxMaL', // Bella
        'Marco': 'VR6AewLTigWG4xSOukaG', // Adam
        'Giulia': 'pNInz6obpgDQGcFmaJgB' // Charlotte
      };

      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceMap[voiceId] || voiceMap['Lara']}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: {
            'xi-api-key': this.elevenLabsApiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      return Buffer.from(response.data);
    } catch (err) {
      console.error('Voice generation error:', err.message);
      throw new Error(`Voice generation failed: ${err.message}`);
    }
  }

  /**
   * Unisce video e audio con FFmpeg
   * @param {string} videoPath - Percorso video
   * @param {Buffer} audioBuffer - Audio buffer
   * @param {string} outputPath - Output percorso
   * @returns {Promise<string>} - Output path
   */
  async mergeVideoAudio(videoPath, audioBuffer, outputPath) {
    return new Promise((resolve, reject) => {
      const audioTempPath = path.join(this.uploadsDir, `temp_audio_${Date.now()}.mp3`);

      // Salva audio temporaneo
      fs.writeFileSync(audioTempPath, audioBuffer);

      ffmpeg(videoPath)
        .input(audioTempPath)
        .outputOptions([
          '-c:v copy',
          '-c:a aac',
          '-map 0:v:0',
          '-map 1:a:0',
          '-shortest'
        ])
        .on('end', () => {
          // Pulisci file temporaneo
          fs.unlinkSync(audioTempPath);
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(err);
        })
        .save(outputPath);
    });
  }

  /**
   * Crea storyboard da sequenza prompt
   * @param {string} userId - ID utente
   * @param {Array} shots - Array di {prompt, duration, transition}
   * @returns {Promise<object>} - Job creazione
   */
  async createStoryboard(userId, shots) {
    try {
      const storyboardId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Salva storyboard metadata
      const storyboardData = {
        id: storyboardId,
        userId,
        shots,
        totalDuration: shots.reduce((sum, s) => sum + (s.duration || 5), 0),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      console.log(`📋 Storyboard created: ${storyboardId} with ${shots.length} shots`);

      return {
        success: true,
        storyboardId,
        totalDuration: storyboardData.totalDuration,
        estimatedTime: shots.length * 120 // 2 min per shot
      };
    } catch (err) {
      console.error('Storyboard error:', err.message);
      throw new Error(`Storyboard creation failed: ${err.message}`);
    }
  }

  /**
   * Applica color grading a video
   * @param {string} inputPath - Input video
   * @param {object} settings - Impostazioni grading
   * @param {string} outputPath - Output video
   * @returns {Promise<string>} - Output path
   */
  async applyColorGrade(inputPath, settings, outputPath) {
    return new Promise((resolve, reject) => {
      // FFmpeg filters per color grading
      const filters = [];

      if (settings.temperature) {
        // Warm/cool temperature
        filters.push(`colortemperature=${settings.temperature}`);
      }

      if (settings.contrast) {
        filters.push(`curves=contrast=${settings.contrast}`);
      }

      if (settings.saturation) {
        filters.push(`saturation=${settings.saturation}`);
      }

      if (settings.lut) {
        // Apply LUT file
        filters.push(`lut3d=${settings.lut}`);
      }

      ffmpeg(inputPath)
        .videoFilters(filters)
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .save(outputPath);
    });
  }

  /**
   * Estrae frame da video
   * @param {string} videoPath - Video percorso
   * @param {number} interval - Intervallo secondi
   * @param {string} outputDir - Output directory
   * @returns {Promise<Array>} - Frame paths
   */
  async extractFrames(videoPath, interval = 1, outputDir) {
    return new Promise((resolve, reject) => {
      const frames = [];
      let frameCount = 0;

      ffmpeg(videoPath)
        .on('end', () => resolve(frames))
        .on('error', reject)
        .on('file', (path) => frames.push(path))
        .saveFrames({
          framerate: 1 / interval,
          filename: 'frame-%d.jpg',
          folder: outputDir
        });
    });
  }

  /**
   * Ottiene dimensioni da aspect ratio
   * @param {string} ratio - Aspect ratio
   * @returns {object} - Width e height
   */
  getDimensions(ratio) {
    const ratios = {
      '16:9': { width: 1920, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
      '1:1': { width: 1080, height: 1080 },
      '4:5': { width: 1080, height: 1350 },
      '21:9': { width: 2560, height: 1080 }
    };

    return ratios[ratio] || ratios['16:9'];
  }

  /**
   * Preset color grading
   * @param {string} preset - Nome preset
   * @returns {object} - Impostazioni
   */
  getColorGradePreset(preset) {
    const presets = {
      'cinematic': { temperature: 6500, contrast: 1.2, saturation: 0.9 },
      'warm': { temperature: 7500, contrast: 1.0, saturation: 1.1 },
      'cool': { temperature: 5500, contrast: 1.1, saturation: 0.95 },
      'noir': { temperature: 6000, contrast: 1.5, saturation: 0 },
      'vivid': { temperature: 6500, contrast: 1.1, saturation: 1.3 },
      'neutral': { temperature: 6500, contrast: 1.0, saturation: 1.0 }
    };

    return presets[preset] || presets['neutral'];
  }
}

module.exports = new CinemaService();
