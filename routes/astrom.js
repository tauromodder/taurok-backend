// routes/astrom.js
const express = require('express');
const router = express.Router();
const deepseekService = require('../services/deepseekService');
const deepseekFastService = require('../services/deepseekFastService');
const feedbackService = require('../services/feedbackService');
const { systemPrompt } = require('../prompts/astromPrompt');

// Nueva ruta para modo rápido
router.post('/fast', async (req, res) => {
    try {
        const { message = '', userId = 'anonimo' } = req.body;

        if (!message.trim()) {
            return res.status(400).json({
                choices: [{
                    message: {
                        content: "Soy Astrom. Por favor, ingresa tu consulta de codigo."
                    }
                }]
            });
        }

        console.log('⚡ Astrom Fast: Consulta recibida');

        // Usar el servicio rápido
        const fastResponse = await deepseekFastService.callDeepSeekFast([
            { role: 'user', content: message }
        ]);

        if (fastResponse?.choices?.[0]?.message?.content) {
            const content = fastResponse.choices[0].message.content;
            const finalResponse = content.includes('Astrom') ? content : "Soy Astrom. " + content;
            return res.json({
                choices: [{ message: { content: finalResponse } }]
            });
        }

        // Fallback al modo normal
        console.log('⚠️ Fallback al modo normal de Astrom');
        const normalResponse = await deepseekService.callDeepSeek([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
        ]);

        const content = normalResponse.choices?.[0]?.message?.content || 
            "Soy Astrom. No pude procesar tu consulta. Intenta con un mensaje mas claro.";
        
        res.json({
            choices: [{ message: { content: content } }]
        });

    } catch (error) {
        console.error('❌ Error en /api/astrom/fast:', error);
        res.status(500).json({
            choices: [{
                message: {
                    content: "Soy Astrom. Error temporal. Por favor, intenta de nuevo."
                }
            }]
        });
    }
});

// Ruta normal (existente)
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
