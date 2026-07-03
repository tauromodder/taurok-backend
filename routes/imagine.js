// routes/imagine.js
const express = require('express');
const router = express.Router();
const pollinationsService = require('../services/pollinationsService');
const feedbackService = require('../services/feedbackService');

router.post('/', async (req, res) => {
    try {
        const { prompt = '', width = 512, height = 512, userId = 'anonimo' } = req.body;

        if (!prompt.trim()) {
            return res.status(400).json({
                error: "Escribe una descripcion para la imagen que quieres generar."
            });
        }

        console.log(`🎨 Imagine: Generando imagen para: ${prompt.substring(0, 30)}...`);
        
        const result = await pollinationsService.generateImage(prompt, { width, height });

        feedbackService.sendFeedback({
            type: 'imagine',
            prompt: prompt,
            success: result.success,
            userId: userId,
            userAgent: req.headers['user-agent'] || 'unknown'
        });

        res.json(result);

    } catch (error) {
        console.error('❌ Error en /api/imagine:', error);
        res.status(500).json({
            error: "El generador de imagenes no esta disponible ahora. Intenta de nuevo mas tarde."
        });
    }
});

module.exports = router;
