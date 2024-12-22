
const express = require('express');
const bodyParser = require('body-parser');
const testiRoutes = require('./routes/testi');
const http = require('http');
const WebSocket = require('ws');
const db = require('./util/database');

const app = express();

// Routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(testiRoutes);

const server = http.createServer(app);

let esp32Client = null;

// Luodaan WebSocket-palvelin samaan HTTP-serveriin
const wss = new WebSocket.Server({ server, path: '/ws' });

// WebSocket-yhteyden käsittely
wss.on('connection', (ws) => {
    console.log('[WS] New client connected');

      // Tallennetaan WebSocket, jotta voimme lähettää viestin /api/led -reitillä
     esp32Client = ws;
  
    ws.on('message', (message) => {
      console.log('[WS] Received:', message.toString());
      // Tässä voit käsitellä ESP32:n tai minkä tahansa laitteen lähettämiä viestejä
      // Voit myös vastata takaisin: ws.send('Hello from server');
    });
  
    ws.on('close', () => {
      console.log('[WS] Client disconnected');
    });
  });

  // HTTP-reitti, jota mobiilisovellus kutsuu LEDin ohjaamiseksi.
app.post("/api/led", (req, res) => {
    if (!esp32Client) {
      return res.status(500).json({ error: "No ESP32 connected via WebSocket" });
    }
  
    const { state } = req.body; // esim. { "state": "on" } tai { "state": "off" }
    if (!state || (state !== "on" && state !== "off")) {
      return res.status(400).json({ error: "Invalid state. Use 'on' or 'off'." });
    }
  
    // Lähetetään komento WebSocketin kautta ESP32:lle muodossa "led:on" tai "led:off"
    const message = `led:${state}`;
    esp32Client.send(message);
    console.log(`[WS -> ESP32] Sent: ${message}`);
  
    return res.json({ message: `LED ${state} command sent` });
  });
// db.execute('INSERT IGNORE INTO users (id, name) VALUES (?, ?)', [1, 'Test User']); // tehdään testi käyttäjä

// // Tallenna laite käyttäjälle
// app.post('/api/device', (req, res) => {
//     const { userId, deviceId, ssid } = req.body;

//     console.log("lähetetään tiedot: ", userId, deviceId, ssid);

//     db.execute('INSERT INTO devices (user_id, device_id, ssid) VALUES (?, ?, ?)', [userId, deviceId, ssid])
//         .then(() => res.status(201).json({ message: "Device registered successfully" }))
//         .catch(err => res.status(500).json({ error: err.message }));
// });

// Hae käyttäjän laitteet
app.get('/api/devices/:userId', (req, res) => {
    const userId = req.params.userId;

    db.execute('SELECT * FROM devices WHERE user_id = ?', [userId])
        .then(([rows]) => res.json({ devices: rows }))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Esimerkin vuoksi, jos haluat testata perusendpointtia:
app.get('/', (req, res) => {
    res.send('<h1>Hello from Node.js + Express + WebSocket!</h1>');
  });
  


// --- KÄYNNISTETÄÄN SERVERI ---
// HUOM: Emme käytä app.listen(...) vaan server.listen(...)

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started")
})
