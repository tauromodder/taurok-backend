// routes/astrom.js
const express = require('express');
const router = express.Router();
const deepseekService = require('../services/deepseekService');
const feedbackService = require('../services/feedbackService');
const { systemPrompt } = require('../prompts/astromPrompt');

router.post('/', async (req, res) => {
    try {
        const { message = '', recentMessages = [], userId = 'anonimo' } = req.body;

        if (!message.trim()) {
            return res.status(400).json({
                choices: [{
                    message: {
                        content: "Ingresa tu consulta de codigo para que Astrom pueda ayudarte."
                    }
                }]
            });
        }

        const messages = [{ role: 'system', content: systemPrompt }];
        const limitedHistory = recentMessages.slice(-15);
        for (const msg of limitedHistory) {
            if (msg?.role && msg?.content) {
                messages.push({ role: msg.role, content: msg.content });
            }
        }
        messages.push({ role: 'user', content: message });

        console.log(`💻 Astrom: Consulta de codigo recibida`);
        const response = await deepseekService.callDeepSeek(messages);

        const responseContent = response.choices?.[0]?.message?.content || '';
        feedbackService.sendFeedback({
            type: 'astrom',
            message: message,
            response: responseContent,
            userId: userId,
            userAgent: req.headers['user-agent'] || 'unknown'
        });

        res.json(response);

    } catch (error) {
        console.error('❌ Error en /api/astrom:', error);
        res.status(500).json({
            choices: [{
                message: {
                    content: "Astrom esta ocupado. Intenta de nuevo en un momento."
                }
            }]
        });
    }
});

module.exports = router;
