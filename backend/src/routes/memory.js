/**
 * AETHERSY AI - Memory Routes
 */

const express = require('express');
const router = express.Router();
const memory = require('../services/memory');

/**
 * POST /api/memory/store
 * Store a new memory
 */
router.post('/store', async (req, res, next) => {
  try {
    const { userId, content, contentType = 'text', metadata = {} } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }

    const result = await memory.store({ userId, content, contentType, metadata });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/memory/search
 * Search memories
 */
router.post('/search', async (req, res, next) => {
  try {
    const { userId, query, limit = 5 } = req.body;

    if (!userId || !query) {
      return res.status(400).json({ error: 'userId and query are required' });
    }

    const results = await memory.search(userId, query, limit);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/memory/stats/:userId
 * Get memory statistics
 */
router.get('/stats/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const stats = await memory.getStats(userId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/memory/:userId/:memoryId
 * Delete a memory
 */
router.delete('/:userId/:memoryId', async (req, res, next) => {
  try {
    const { userId, memoryId } = req.params;
    const result = await memory.delete(userId, memoryId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/memory/archive/:userId
 * Archive old memories
 */
router.post('/archive/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const archived = await memory.archiveOldMemories(userId);
    res.json({ archived });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/memory/import
 * Import batch of memories
 */
router.post('/import', async (req, res, next) => {
  try {
    const { userId, memories } = req.body;

    if (!userId || !memories || !Array.isArray(memories)) {
      return res.status(400).json({ error: 'userId and memories array are required' });
    }

    const result = await memory.importBatch(userId, memories);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/memory/context/:userId
 * Get context for chat
 */
router.get('/context/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'query parameter is required' });
    }

    const context = await memory.getContextForChat(userId, query);
    res.json({ context });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
