// services/groqService.js
const axios = require('axios');

class GroqService {
    constructor() {
        // Cargar API Keys desde variables de entorno
        this.apiKeys = [
            process.env.GROQ_API_KEY_1,
            process.env.GROQ_API_KEY_2,
            process.env.GROQ_API_KEY_3,
            process.env.GROQ_API_KEY_4,
            process.env.GROQ_API_KEY_5
        ].filter(key => key && key.trim() !== '');

        if (this.apiKeys.length === 0) {
            console.warn('⚠️ No hay API Keys de Groq configuradas');
        }

        // Control de uso de cada key
        this.keyUsage = {};
        this.apiKeys.forEach(key => {
            this.keyUsage[key] = {
                requestsToday: 0,
                lastReset: new Date().toDateString(),
                cooldownUntil: 0
            };
        });

        // Modelos disponibles
        this.models = {
            fast: 'llama-3.1-8b-instant',
            auto: 'llama-3.2-11b-text-preview',
            expert: 'llama-3.3-70b-versatile',
            heavy: 'llama-3.3-70b-versatile'
        };

        // Mensajes de error amigables (sin revelar información técnica)
        this.errorMessages = [
            "Taurok esta experimentando una alta demanda de solicitudes en este momento. Estamos procesando los datos para restablecer el servicio a su velocidad habitual. Por favor, intentelo de nuevo en unos minutos.",
            "En este momento, nuestros sistemas se encuentran al limite de su capacidad de procesamiento. Agradecemos su paciencia. Por favor, reintente su consulta en un momento.",
            "Ha alcanzado el limite de solicitudes permitidas por minuto para asegurar un rendimiento optimo de Taurok. Por favor, espere unos segundos antes de enviar su proximo mensaje.",
            "La solicitud tomo mas tiempo del esperado en procesarse debido a la alta carga actual del sistema. Por favor, simplifique su consulta o intente enviarla nuevamente.",
            "Taurok IA esta teniendo problemas tecnicos momentaneos. Nuestro equipo esta trabajando para resolverlo. Gracias por su paciencia.",
            "El servidor esta procesando muchas solicitudes. Su mensaje es importante. Intente nuevamente en un momento.",
            "Taurok IA esta reiniciando conexiones. Su mensaje esta en cola. Por favor, espere un momento y vuelva a intentarlo."
        ];
    }

    resetDailyCounters() {
        const today = new Date().toDateString();
        this.apiKeys.forEach(key => {
            if (this.keyUsage[key].lastReset !== today) {
                this.keyUsage[key].requestsToday = 0;
                this.keyUsage[key].lastReset = today;
            }
        });
    }

    getBestAvailableKey() {
        this.resetDailyCounters();
        const now = Date.now();
        const LIMITE_POR_KEY = 30;

        const availableKeys = this.apiKeys.filter(key => {
            const isCooldownActive = this.keyUsage[key].cooldownUntil > now;
            const isUnderLimit = this.keyUsage[key].requestsToday < LIMITE_POR_KEY;
            return !isCooldownActive && isUnderLimit;
        });

        if (availableKeys.length === 0) {
            // Buscar la key que se desbloquee primero
            let soonestKey = null;
            let soonestTime = Infinity;
            this.apiKeys.forEach(key => {
                if (this.keyUsage[key].cooldownUntil < soonestTime) {
                    soonestTime = this.keyUsage[key].cooldownUntil;
                    soonestKey = key;
                }
            });
            if (soonestKey) {
                const waitTime = Math.ceil((soonestTime - now) / 1000);
                console.log(`⏳ Todas las keys en cooldown. Proxima en ${waitTime}s`);
            }
            return null;
        }

        return availableKeys.reduce((best, key) => {
            return this.keyUsage[key].requestsToday < this.keyUsage[best].requestsToday ? key : best;
        }, availableKeys[0]);
    }

    incrementKeyUsage(key) {
        if (this.keyUsage[key]) {
            this.keyUsage[key].requestsToday++;
        }
    }

    setKeyCooldown(key, seconds = 30) {
        if (this.keyUsage[key]) {
            this.keyUsage[key].cooldownUntil = Date.now() + (seconds * 1000);
        }
    }

    getRandomErrorMessage() {
        const randomIndex = Math.floor(Math.random() * this.errorMessages.length);
        return this.errorMessages[randomIndex];
    }

    async callGroq(messages, model = this.models.fast, retryCount = 0) {
        const MAX_RETRIES = 3;

        for (let intento = 0; intento < this.apiKeys.length * 2; intento++) {
            const apiKey = this.getBestAvailableKey();
            if (!apiKey) break;

            try {
                const response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: model,
                        messages: messages,
                        temperature: 0.85,
                        max_tokens: 1024
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 15000
                    }
                );

                if (response.data?.choices?.[0]?.message?.content) {
                    this.incrementKeyUsage(apiKey);
                    console.log(`✅ Taurok respondio con ${apiKey.substring(0, 8)}...`);
                    return response.data;
                }
            } catch (error) {
                if (error.response) {
                    const status = error.response.status;
                    if (status === 429) {
                        console.log(`⚠️ Rate limit en key ${apiKey.substring(0, 8)}...`);
                        this.setKeyCooldown(apiKey, 30);
                    } else if (status === 401 || status === 403) {
                        console.log(`❌ Key invalida: ${apiKey.substring(0, 8)}...`);
                        this.setKeyCooldown(apiKey, 300);
                    } else {
                        console.log(`⚠️ Error con key ${apiKey.substring(0, 8)}...: ${status}`);
                        this.setKeyCooldown(apiKey, 15);
                    }
                } else if (error.code === 'ECONNABORTED') {
                    console.log(`⏰ Timeout en key ${apiKey.substring(0, 8)}...`);
                    this.setKeyCooldown(apiKey, 15);
                } else {
                    console.log(`❌ Error desconocido con key ${apiKey.substring(0, 8)}...`);
                    this.setKeyCooldown(apiKey, 10);
                }
            }
        }

        console.log('❌ Todas las keys fallaron. Devolviendo mensaje amigable.');
        return {
            choices: [{
                message: {
                    content: this.getRandomErrorMessage()
                }
            }]
        };
    }
}

module.exports = new GroqService();
