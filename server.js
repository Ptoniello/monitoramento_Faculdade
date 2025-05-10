const express = require('express');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ======================================
// Integrantes do grupo
// ======================================
const integrantes = [
  'Leonardo Cartaxo',
  'Laura Neres',
  'Pedro Toniello',
  'Gustavo Malfi Costa',
  'Gabriel Tavares Reis',
  'Sara Martins de Almeida',
  'Lucas Reis de Souza',
  'Ryan Baltazar Silva'
];

// ======================================
// Configuração do Banco de Dados
// ======================================
const sequelize = new Sequelize('motor_monitoring', 'node_user', 'node_pass', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false,
  define: {
    schema: 'public'
  },
  dialectOptions: {
    useUTC: false,
    dateStrings: true,
    typeCast: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// ======================================
// Modelo do Sensor
// ======================================
const SensorData = sequelize.define('SensorData', {
  deviceId: { 
    type: DataTypes.STRING,
    allowNull: false
  },
  vibration: { 
    type: DataTypes.FLOAT,
    allowNull: false 
  },
  temperature: { 
    type: DataTypes.FLOAT,
    allowNull: false 
  },
  humidity: { 
    type: DataTypes.FLOAT,
    allowNull: false 
  },
  accX: { 
    type: DataTypes.FLOAT,
    allowNull: false 
  },
  accY: { 
    type: DataTypes.FLOAT,
    allowNull: false 
  },
  accZ: { 
    type: DataTypes.FLOAT,
    allowNull: false 
  },
  timestamp: { 
    type: DataTypes.BIGINT,
    allowNull: false 
  },
  receivedAt: { 
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW 
  }
}, 
{
  tableName: 'sensor_data',
  timestamps: false,
  schema: 'public'
});

// ======================================
// Sincronização com o Banco
// ======================================
sequelize.authenticate()
  .then(() => sequelize.sync({ force: false, alter: true }))
  .then(() => console.log('✅ Banco de dados conectado e sincronizado'))
  .catch(err => {
    console.error('❌ Falha na conexão:', err);
    setTimeout(() => sequelize.sync(), 5000);
  });

// ======================================
// Middlewares
// ======================================
app.use(cors());
app.use(bodyParser.json());

// ======================================
// Rotas
// ======================================

// Rota principal
app.get('/', (req, res) => {
  res.json({
    name: "API de Monitoramento de Motores",
    version: "1.0.0",
    endpoints: [
      { method: "POST", path: "/api/sensor", description: "Envia dados do sensor" },
      { method: "GET", path: "/api/sensor", description: "Recupera últimos 100 registros" },
      { method: "GET", path: "/health", description: "Verifica status do servidor" },
      { method: "integrantes", path: "/integrantes", description: "Integrantes do nosso grupo" }
    ]
  });
});

//Integrantes
app.get('/integrantes', (req, res) => {
  res.json({
    success: true,
    members: integrantes
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'operational',
    database: sequelize.authenticated ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// POST - Recebe dados do sensor
app.post('/api/sensor', async (req, res) => {
  try {
    const requiredFields = ['deviceId', 'vibration', 'temperature'];
    const missingFields = requiredFields.filter(field => !(field in req.body));

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Campos obrigatórios faltando',
        missing: missingFields
      });
    }

    const sensorRecord = await SensorData.create(req.body);

    // Verifica alertas
    const alerts = [];
    if (sensorRecord.vibration > 2.0) alerts.push(`Vibração alta: ${sensorRecord.vibration}g`);
    if (sensorRecord.temperature > 60) alerts.push(`Temperatura crítica: ${sensorRecord.temperature}°C`);

    if (alerts.length > 0) {
      console.warn(`⚠️ ALERTAS para ${sensorRecord.deviceId}:`, alerts.join(' | '));
    }

    res.status(201).json({
      success: true,
      id: sensorRecord.id,
      receivedAt: sensorRecord.receivedAt,
      alerts
    });

  } catch (error) {
    console.error("Erro no POST:", error);
    res.status(500).json({ 
      error: 'Falha no processamento',
      details: error.message 
    });
  }
});

// GET - Recupera dados
app.get('/api/sensor', async (req, res) => {
  try {
    const data = await SensorData.findAll({
      order: [['receivedAt', 'DESC']],
      limit: 100,
      attributes: { exclude: ['id'] } // Oculta o campo ID
    });
    
    res.json({
      count: data.length,
      results: data
    });

  } catch (error) {
    console.error("Erro no GET:", error);
    res.status(500).json({ 
      error: 'Falha na consulta',
      details: error.message 
    });
  }
});

// ======================================
// Tratamento de Erros
// ======================================

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    path: req.path,
    method: req.method,
    suggestedEndpoints: [
      '/api/sensor (GET/POST)',
      '/health'
    ]
  });
});

// Erros globais
app.use((err, req, res, next) => {
  console.error('🔥 Erro não tratado:', err.stack);
  res.status(500).json({
    error: 'Falha interna do servidor',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ======================================
// Inicialização do Servidor
// ======================================
app.listen(PORT, () => {
  console.log(`
  🚀 Servidor operacional
  📡 Endereço: http://localhost:${PORT}
  ⏰ Iniciado em: ${new Date().toLocaleTimeString()}
  `);
});

//Não vejo sentido em usar emojis nos códigos
//mas se o professor usou... vamos usar também
