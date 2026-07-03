// services/feedbackService.js
const axios = require('axios');

class FeedbackService {
    constructor() {
        this.url = process.env.FORMSPREE_URL || 'https://formspree.io/f/mbdvppep';
    }

    async sendFeedback(data) {
        try {
            // No esperamos la respuesta para no bloquear
            await axios.post(this.url, {
                ...data,
                timestamp: new Date().toISOString(),
                userAgent: data.userAgent || 'unknown'
            });
            console.log('📤 Feedback enviado a Formspree');
        } catch (error) {
            console.error('❌ Error enviando feedback:', error.message);
        }
    }
}

module.exports = new FeedbackService();
