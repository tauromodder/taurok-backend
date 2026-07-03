// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Importar Rutas
const taurokRoutes = require('./routes/taurok');
const astromRoutes = require('./routes/astrom');
const imagineRoutes = require('./routes/imagine');

// Usar Rutas
app.use('/api/taurok', taurokRoutes);
app.use('/api/astrom', astromRoutes);
app.use('/api/imagine', imagineRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
    res.json({
        status: 'Taurok IA v2.0 Online',
        timestamp: new Date().toISOString(),
        services: {
            taurok: 'Groq/Llama',
            astrom: 'DeepSeek (NVIDIA)',
            imagine: 'Pollinations AI'
        }
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'Taurok IA API v2.0',
        endpoints: {
            taurok: '/api/taurok',
            astrom: '/api/astrom',
            imagine: '/api/imagine'
        }
    });
});

app.listen(PORT, () => {
    console.log('=================================');
    console.log('🚀 Taurok IA v2.0');
    console.log(`📡 Servidor en puerto ${PORT}`);
    console.log('📊 Servicios activos:');
    console.log('   - Taurok (Groq/Llama)');
    console.log('   - Astrom (DeepSeek/NVIDIA)');
    console.log('   - Imagine (Pollinations)');
    console.log('=================================');
});
