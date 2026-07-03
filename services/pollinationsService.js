// services/pollinationsService.js
const axios = require('axios');

class PollinationsService {
    constructor() {
        this.baseUrl = process.env.POLLINATIONS_URL || 'https://image.pollinations.ai/prompt/';
        
        this.errorMessages = [
            "No se pudo generar la imagen. Intenta con una descripcion mas clara.",
            "El generador de imagenes esta sobrecargado. Espera unos segundos y vuelve a intentarlo.",
            "La imagen no se pudo crear. Prueba con un prompt mas simple.",
            "Taurok AI no esta disponible en este momento. Intenta de nuevo mas tarde."
        ];
    }

    getRandomErrorMessage() {
        const randomIndex = Math.floor(Math.random() * this.errorMessages.length);
        return this.errorMessages[randomIndex];
    }

    async generateImage(prompt, options = {}) {
        try {
            // Limpiar prompt para URL
            const cleanPrompt = encodeURIComponent(prompt.trim());
            
            // Parametros opcionales
            const width = options.width || 512;
            const height = options.height || 512;
            const seed = options.seed || Math.floor(Math.random() * 10000);
            
            // Construir URL de Pollinations
            const url = `${this.baseUrl}${cleanPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
            
            console.log(`🎨 Generando imagen con prompt: ${prompt.substring(0, 30)}...`);
            
            // Pollinations devuelve la imagen directamente, solo validamos que exista
            const response = await axios.head(url, { timeout: 5000 });
            
            if (response.status === 200) {
                return {
                    success: true,
                    url: url,
                    prompt: prompt,
                    width: width,
                    height: height
                };
            }
        } catch (error) {
            console.error('Error en Pollinations:', error.message);
        }

        return {
            success: false,
            message: this.getRandomErrorMessage()
        };
    }
}

module.exports = new PollinationsService();
