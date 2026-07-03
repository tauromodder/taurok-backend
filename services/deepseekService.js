// services/deepseekService.js
const axios = require('axios');

class DeepSeekService {
    constructor() {
        this.apiKey = process.env.DEEPSEEK_API_KEY;
        this.endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';
        
        if (!this.apiKey) {
            console.warn('⚠️ No hay API Key de DeepSeek configurada');
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
        try {
            const response = await axios.post(
                this.endpoint,
                {
                    model: this.model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 2048,
                    top_p: 0.95
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                }
            );

            if (response.data?.choices?.[0]?.message?.content) {
                console.log('✅ Astrom respondio exitosamente');
                return response.data;
            }
        } catch (error) {
            console.error('Error en DeepSeek:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
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
}

module.exports = new DeepSeekService();
