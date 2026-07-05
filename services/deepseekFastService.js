// services/deepseekFastService.js
const axios = require('axios');

class DeepSeekFastService {
    constructor() {
        this.apiKey = process.env.DEEPSEEK_API_KEY;
        this.endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos de caché
    }

    async callDeepSeekFast(messages) {
        // Generar clave de caché basada en el mensaje
        const cacheKey = this.generateCacheKey(messages);
        
        // Verificar caché
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('⚡ Respuesta desde caché');
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        try {
            const startTime = Date.now();
            
            const response = await axios.post(
                this.endpoint,
                {
                    model: 'deepseek-ai/deepseek-v4-pro',
                    messages: this.optimizeMessages(messages),
                    temperature: 0.2,      // Más bajo = más rápido
                    max_tokens: 512,       // Respuestas más cortas
                    top_p: 0.8,
                    // ⚡ Desactivar el "thinking" si existe
                    chat_template_kwargs: {
                        thinking: false
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 15000
                }
            );

            const elapsed = Date.now() - startTime;
            console.log(`⚡ Astrom Fast respondió en ${elapsed}ms`);

            if (response.data?.choices?.[0]?.message?.content) {
                // Guardar en caché
                this.cache.set(cacheKey, {
                    data: response.data,
                    timestamp: Date.now()
                });
                return response.data;
            }
        } catch (error) {
            console.error('Error en DeepSeek Fast:', error.message);
        }

        return null;
    }

    optimizeMessages(messages) {
        // Prompt ultra-conciso para respuestas rápidas
        const systemPrompt = 'Eres Astrom, asistente de programacion. Responde concreto y breve.';
        const userMessages = messages.filter(m => m.role !== 'system');
        
        // Mantener solo últimos 5 mensajes
        const recent = userMessages.slice(-5);
        return [{ role: 'system', content: systemPrompt }, ...recent];
    }

    generateCacheKey(messages) {
        const relevant = messages.filter(m => m.role === 'user').slice(-3);
        return JSON.stringify(relevant);
    }
}

module.exports = new DeepSeekFastService();
