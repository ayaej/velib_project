const express = require('express');
const router = express.Router();
const { getStationsCollection } = require('./db');

/**
 * GET /api/stations
 * Récupérer toutes les stations (avec pagination)
 */
router.get('/stations', async (req, res) => {
  try {
    const collection = getStationsCollection();
    
    // Paramètres de pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // TODO: Implémenter la logique de récupération
    // Récupérer les données les plus récentes de chaque station
    const stations = await collection
      .find({})
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments({});

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
    console.error('Error fetching stations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch stations',
      message: error.message 
    });
  }
});

/**
 * GET /api/stations/top
 * Récupérer les stations avec le plus de vélos disponibles
 */
router.get('/stations/top', async (req, res) => {
  try {
    const collection = getStationsCollection();
    const limit = parseInt(req.query.limit) || 10;

    // TODO: Implémenter la logique pour trouver les top stations
    // Agréger les données pour trouver les stations les plus fournies
    const topStations = await collection
      .aggregate([
        // Pipeline d'agrégation à compléter
        { $sort: { numBikesAvailable: -1 } },
        { $limit: limit }
      ])
      .toArray();

    res.json({
      success: true,
      data: topStations
    });
  } catch (error) {
    console.error('Error fetching top stations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch top stations',
      message: error.message 
    });
  }
});

/**
 * GET /api/stations/critical
 * Récupérer les stations critiques (peu de vélos ou peu de places)
 */
router.get('/stations/critical', async (req, res) => {
  try {
    const collection = getStationsCollection();
    const threshold = parseInt(req.query.threshold) || 3;

    // TODO: Implémenter la logique pour identifier les stations critiques
    // Stations avec moins de X vélos ou moins de X places disponibles
    const criticalStations = await collection
      .find({
        $or: [
          { numBikesAvailable: { $lte: threshold } },
          { numDocksAvailable: { $lte: threshold } }
        ]
      })
      .sort({ numBikesAvailable: 1 })
      .toArray();

    res.json({
      success: true,
      data: criticalStations,
      threshold
    });
  } catch (error) {
    console.error('Error fetching critical stations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch critical stations',
      message: error.message 
    });
  }
});

/**
 * GET /api/stations/:id
 * Récupérer une station spécifique par son ID
 */
router.get('/stations/:id', async (req, res) => {
  try {
    const collection = getStationsCollection();
    const stationId = req.params.id;

    // TODO: Implémenter la récupération d'une station spécifique
    const station = await collection.findOne({ stationCode: stationId });

    if (!station) {
      return res.status(404).json({ 
        success: false, 
        error: 'Station not found' 
      });
    }

    res.json({
      success: true,
      data: station
    });
  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch station',
      message: error.message 
    });
  }
});

/**
 * GET /api/stats
 * Récupérer des statistiques globales
 */
router.get('/stats', async (req, res) => {
  try {
    const collection = getStationsCollection();

    // TODO: Calculer des statistiques globales
    // - Nombre total de stations
    // - Total de vélos disponibles
    // - Total de places disponibles
    // - Taux d'occupation moyen
    
    const stats = await collection.aggregate([
      {
        $group: {
          _id: null,
          totalStations: { $sum: 1 },
          totalBikes: { $sum: '$numBikesAvailable' },
          totalDocks: { $sum: '$numDocksAvailable' },
          avgOccupancy: { $avg: '$capacity' }
        }
      }
    ]).toArray();

    res.json({
      success: true,
      data: stats[0] || {}
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch stats',
      message: error.message 
    });
  }
});

module.exports = router;
