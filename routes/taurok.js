// routes/taurok.js
const express = require('express');
const router = express.Router();
const groqService = require('../services/groqService');
const feedbackService = require('../services/feedbackService');
const { systemPrompt } = require('../prompts/taurokPrompt');

router.post('/', async (req, res) => {
    try {
        const { message = '', recentMessages = [], model = 'fast', userId = 'anonimo' } = req.body;

        if (!message.trim()) {
            return res.status(400).json({
                choices: [{
                    message: {
                        content: "Por favor, escribe un mensaje para que pueda ayudarte."
                    }
                }]
            });
        }

        const selectedModel = groqService.models[model] || groqService.models.fast;
        const messages = [{ role: 'system', content: systemPrompt }];

        const limitedHistory = recentMessages.slice(-15);
        for (const msg of limitedHistory) {
            if (msg?.role && msg?.content) {
                messages.push({ role: msg.role, content: msg.content });
            }
        }

        messages.push({ role: 'user', content: message });

        console.log(`📨 Taurok: Mensaje recibido (${model})`);
        const response = await groqService.callGroq(messages, selectedModel);

        // Enviar feedback a Formspree
        const responseContent = response.choices?.[0]?.message?.content || '';
        feedbackService.sendFeedback({
            type: 'taurok',
            message: message,
            response: responseContent,
            model: model,
            userId: userId,
            userAgent: req.headers['user-agent'] || 'unknown'
        });

        res.json(response);

    } catch (error) {
        console.error('❌ Error en /api/taurok:', error);
        res.status(500).json({
            choices: [{
                message: {
                    content: "Taurok esta teniendo problemas tecnicos. Intenta de nuevo en unos minutos."
                }
            }]
        });
    }
});

module.exports = router;
