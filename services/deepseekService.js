// services/deepseekService.js
const axios = require('axios');

class DeepSeekService {
    constructor() {
        this.apiKey = process.env.DEEPSEEK_API_KEY;
        this.endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';
        
        if (!this.apiKey) {
            console.warn('⚠️ No hay API Key de Astrom configurada');
        }

        this.model = 'deepseek-ai/deepseek-v4-pro';
        
        this.errorMessages = [
            "Astrom no puede procesar tu solicitud en este momento. La demanda de codigo es muy alta. Intenta de nuevo en unos segundos.",
            "El servidor de Astrom esta sobrecargado. Por favor, simplifica tu consulta o espera un momento.",
            "Astrom esta teniendo problemas para generar una respuesta. Intenta con un prompt mas especifico.",
            "La conexion con el modelo de codigo fallo. Por favor, intenta de nuevo en un minuto.",
            "Astrom esta procesando muchas solicitudes. Tu consulta es importante, reintenta en breve."
        ];
    }

    getRandomErrorMessage() {
        const randomIndex = Math.floor(Math.random() * this.errorMessages.length);
        return this.errorMessages[randomIndex];
    }

    async callDeepSeek(messages) {
        // Optimizar mensajes para respuestas más rápidas
        const optimizedMessages = this.optimizeMessages(messages);
        
        try {
            const startTime = Date.now();
            
            const response = await axios.post(
                this.endpoint,
                {
                    model: this.model,
                    messages: optimizedMessages,
                    temperature: 0.3,  // Reducido para respuestas más directas
                    max_tokens: 1024,   // Reducido para menor tiempo de generación
                    top_p: 0.85,
                    // ⚡ Parámetros para acelerar
                    presence_penalty: 0.1,
                    frequency_penalty: 0.1,
                    // ⚡ Usar streaming para feedback en tiempo real
                    stream: false
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 25000  // Timeout más corto
                }
            );

            const elapsed = Date.now() - startTime;
            console.log(`⚡ Astrom respondió en ${elapsed}ms`);

            if (response.data?.choices?.[0]?.message?.content) {
                console.log('✅ Astrom respondio exitosamente');
                return response.data;
            }
        } catch (error) {
            console.error('Error en DeepSeek:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', JSON.stringify(error.response.data, null, 2));
            }
        }

        return {
            choices: [{
                message: {
                    content: this.getRandomErrorMessage()
                }
            }]
        };
    }

    // Método para optimizar mensajes y reducir tokens
    optimizeMessages(messages) {
        // Si hay un mensaje de sistema, asegurar que sea conciso
        const optimized = messages.map(msg => {
            if (msg.role === 'system' && msg.content.length > 200) {
                // Resumir el prompt del sistema
                return {
                    role: 'system',
                    content: 'Eres Astrom, asistente de programacion. Responde SOLO preguntas tecnicas. Se conciso y directo. No te identifiques como Taurok.'
                };
            }
            return msg;
        });

        // Limitar el historial a los últimos 10 mensajes
        if (optimized.length > 12) {
            const systemMsg = optimized.find(m => m.role === 'system');
            const otherMsgs = optimized.filter(m => m.role !== 'system');
            const limited = otherMsgs.slice(-10);
            return systemMsg ? [systemMsg, ...limited] : limited;
        }

        return optimized;
    }
}

module.exports = new DeepSeekService();
