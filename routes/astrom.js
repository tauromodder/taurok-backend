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
                        content: "Soy Astrom. Por favor, ingresa tu consulta de codigo."
                    }
                }]
            });
        }

        // SIEMPRE incluir el prompt de Astrom al inicio
        const messages = [{ role: 'system', content: systemPrompt }];
        
        // Limitar historial reciente
        const limitedHistory = recentMessages.slice(-15);
        for (const msg of limitedHistory) {
            if (msg?.role && msg?.content) {
                messages.push({ role: msg.role, content: msg.content });
            }
        }
        messages.push({ role: 'user', content: message });

        console.log('💻 Astrom: Consulta de codigo recibida');
        console.log('📝 Prompt de Astrom aplicado correctamente');
        
        const response = await deepseekService.callDeepSeek(messages);

        const responseContent = response.choices?.[0]?.message?.content || 
            "Soy Astrom. No pude procesar tu consulta de codigo. Intenta con un mensaje mas claro.";

        // Enviar feedback a Formspree
        feedbackService.sendFeedback({
            type: 'astrom',
            message: message,
            response: responseContent,
            userId: userId,
            userAgent: req.headers['user-agent'] || 'unknown'
        });

        // Asegurar que la respuesta se identifique como Astrom
        const finalResponse = responseContent.includes('Astrom') ? 
            responseContent : 
            "Soy Astrom. " + responseContent;

        res.json({
            choices: [{
                message: {
                    content: finalResponse
                }
            }]
        });

    } catch (error) {
        console.error('❌ Error en /api/astrom:', error);
        res.status(500).json({
            choices: [{
                message: {
                    content: "Soy Astrom. Estoy teniendo problemas tecnicos. Por favor, intenta de nuevo en unos minutos."
                }
            }]
        });
    }
});

module.exports = router;
