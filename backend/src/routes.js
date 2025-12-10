const express = require('express');
const router = express.Router();
const { getDB } = require('./db');

/**
 * GET /api/stations
 * Récupérer toutes les stations avec pagination
 */
router.get('/stations', async (req, res) => {
  try {
    const db = getDB();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const stations = await db.collection('stations')
      .find({})
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection('stations').countDocuments();

    res.json({
      success: true,
      data: stations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/stations/top
 * Récupérer les stations avec le plus de vélos disponibles
 */
router.get('/stations/top', async (req, res) => {
  try {
    const db = getDB();
    const limit = parseInt(req.query.limit) || 10;

    const stations = await db.collection('stations')
      .find({ isInstalled: true })
      .sort({ numBikesAvailable: -1 })
      .limit(limit)
      .toArray();

    res.json({ success: true, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/stations/critical
 * Récupérer les stations critiques (peu de vélos ou places)
 */
router.get('/stations/critical', async (req, res) => {
  try {
    const db = getDB();
    const threshold = parseInt(req.query.threshold) || 3;

    const stations = await db.collection('stations')
      .find({
        isInstalled: true,
        $or: [
          { numBikesAvailable: { $lte: threshold } },
          { numDocksAvailable: { $lte: threshold } }
        ]
      })
      .sort({ numBikesAvailable: 1 })
      .toArray();

    res.json({ success: true, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/stations/:id
 * Récupérer une station spécifique
 */
router.get('/stations/:id', async (req, res) => {
  try {
    const db = getDB();
    const stationCode = req.params.id;

    const station = await db.collection('stations')
      .findOne({ stationCode: stationCode });

    if (!station) {
      return res.status(404).json({ 
        success: false, 
        error: 'Station not found' 
      });
    }

    res.json({ success: true, data: station });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/stats
 * Récupérer les statistiques globales
 */
router.get('/stats', async (req, res) => {
  try {
    const db = getDB();

    const stats = await db.collection('stations').aggregate([
      {
        $match: { isInstalled: true }
      },
      {
        $group: {
          _id: null,
          totalStations: { $sum: 1 },
          totalBikes: { $sum: '$numBikesAvailable' },
          totalDocks: { $sum: '$numDocksAvailable' },
          totalCapacity: { $sum: '$capacity' },
          avgBikesPerStation: { $avg: '$numBikesAvailable' },
          avgDocksPerStation: { $avg: '$numDocksAvailable' }
        }
      }
    ]).toArray();

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          totalStations: 0,
          totalBikes: 0,
          totalDocks: 0,
          avgOccupancy: 0
        }
      });
    }

    const result = stats[0];
    const avgOccupancy = result.totalCapacity > 0 
      ? (result.totalBikes / result.totalCapacity) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        totalStations: result.totalStations,
        totalBikes: result.totalBikes,
        totalDocks: result.totalDocks,
        avgOccupancy: Math.round(avgOccupancy * 10) / 10,
        avgBikesPerStation: Math.round(result.avgBikesPerStation * 10) / 10,
        avgDocksPerStation: Math.round(result.avgDocksPerStation * 10) / 10
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Routes pour les données batch

/**
 * GET /api/batch/incidents
 * Récupère tous les incidents détectés par le batch
 */
router.get('/batch/incidents', async (req, res) => {
  try {
    const db = getDB();
    const incidents = await db.collection('station_incidents')
      .find({})
      .sort({ date: -1, incidentCount: -1 })
      .limit(100)
      .toArray();
    
    res.json({
      success: true,
      data: incidents,
      count: incidents.length
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch incidents'
    });
  }
});

/**
 * GET /api/batch/empty-full
 * Récupère les stations fréquemment vides ou pleines
 */
router.get('/batch/empty-full', async (req, res) => {
  try {
    const db = getDB();
    const emptyFullStations = await db.collection('stations_empty_full_tracking')
      .find({})
      .sort({ emptyPercentage: -1 })
      .limit(100)
      .toArray();
    
    res.json({
      success: true,
      data: emptyFullStations,
      count: emptyFullStations.length
    });
  } catch (error) {
    console.error('Error fetching empty-full stations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch empty-full stations'
    });
  }
});

/**
 * GET /api/batch/daily-stats
 * Récupère les statistiques globales quotidiennes
 */
router.get('/batch/daily-stats', async (req, res) => {
  try {
    const db = getDB();
    const { date } = req.query;
    
    const query = date ? { date } : {};
    const dailyStats = await db.collection('daily_stats')
      .find(query)
      .sort({ _id: -1 })
      .limit(30)
      .toArray();
    
    res.json({
      success: true,
      data: dailyStats,
      count: dailyStats.length
    });
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily stats'
    });
  }
});

/**
 * GET /api/batch/aggregated
 * Récupère les données agrégées par station
 */
router.get('/batch/aggregated', async (req, res) => {
  try {
    const db = getDB();
    const { stationCode, limit = 50 } = req.query;
    
    const query = stationCode ? { stationCode } : {};
    const aggregated = await db.collection('stations_aggregated')
      .find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    res.json({
      success: true,
      data: aggregated,
      count: aggregated.length
    });
  } catch (error) {
    console.error('Error fetching aggregated data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch aggregated data'
    });
  }
});

module.exports = router;
