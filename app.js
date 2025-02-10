
const express = require('express');
const bodyParser = require('body-parser');
const testiRoutes = require('./routes/testi');
const authRoutes = require('./routes/authRoutes')
const http = require('http');
const WebSocket = require('ws');
const db = require('./util/database');
const mongoose = require('mongoose');


const app = express();

// Routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
// app.use(testiRoutes);
app.use(authRoutes);

mongoose.connect(process.env.DATABASE_URL);
mongoose.connection.on('connected', () => {
  console.log("Connected to mongodb")
})
mongoose.connection.on('error', (err) => {
  console.log(err);
})

const server = http.createServer(app);

let esp32Client = null;


// Luodaan WebSocket-palvelin samaan HTTP-serveriin
const wss = new WebSocket.Server({ server, path: '/ws' });

// WebSocket-yhteyden käsittely
// wss.on('connection', (ws) => {
//     console.log('[WS] New client connected');

//       // Tallennetaan WebSocket, jotta voimme lähettää viestin /api/led -reitillä
//      esp32Client = ws;
  
//     ws.on('message', (message) => {
//       console.log('[WS] Received:', message.toString());
//       // Tässä voit käsitellä ESP32:n tai minkä tahansa laitteen lähettämiä viestejä
//       // Voit myös vastata takaisin: ws.send('Hello from server');
//     });
  
//     ws.on('close', () => {
//       console.log('[WS] Client disconnected');
//     });
//   });
// WebSocket-yhteyden käsittely
let relayStatus = "unknown";  // Tallennetaan viimeisin releen tila

wss.on('connection', (ws, req) => {
  // Tarkista, että yhteys tulee polusta '/ws'
  if (req.url === '/ws') {
      console.log('[WS] ESP32 client connected via /ws');
      esp32Client = ws;

      ws.on('message', (message) => {
          console.log('[WS] Received:', message.toString());

          if (message.toString() === 'ping') {
            // Vastaa pongilla
            ws.send('pong');
            console.log('[WS] Responded with pong');
        }
        if (message.toString() === "relay:get") {
          ws.send(`relay:${relayStatus}`);
        }
              // 🔹 Kun ESP32 lähettää "relay:closed" tai "relay:open", päivitetään tila
              if (message.toString().startsWith("relay:")) {
                relayStatus = message.toString().split(":")[1];
                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(`relay:${relayStatus}`);
                  }
                });
          // Voit käsitellä ESP32:n tai muiden laitteiden lähettämiä viestejä täällä
          // Esimerkiksi: ws.send('Hello from server');
      });

      ws.on('close', () => {
          console.log('[WS] ESP32 client disconnected');
          esp32Client = null;
      });

      ws.on('error', (error) => {
          console.error('[WS] WebSocket error:', error);
      });
  } else {
      // Sulje yhteys, jos polku ei ole '/ws'
      ws.close(1008, 'Invalid path');
      console.log('[WS] Connection attempt to invalid path:', req.url);
  }
});
// Reitti yhteyden tilan tarkistamiseen (React Expoon)
app.get('/api/ws-status', (req, res) => {
  res.json({ connected: esp32Client !== null });
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

  app.post("/api/motor", (req,res) => {
    if (!esp32Client) {
      return res.status(500).json({error: "No esp32 connected via webSocket"});
    }

    const {direction} = req.body;

    if (!direction || (direction !== "forward" && direction !== "backward" && direction !== "stop")) {
      return res.status(400).json({ error: "Invalid direction. Use 'forward' or 'backward'." });
    }


    const message = `motor:${direction}`;
    esp32Client.send(message);
    console.log(`[WS -> ESP32] Sent: ${message}`);
  
    return res.json({ message: `Motor ${direction} command sent` });

  })

  app.post("/api/motor/speed", (req, res) => {
    if (!esp32Client) {
      return res.status(500).json({ error: "No esp32 connected via WebSocket" });
    }
    const { speed, direction } = req.body;
    const message = `motor:speed:${speed}:${direction}`;
    esp32Client.send(message);
    console.log(`[WS -> ESP32] Sent: ${message}`);
    return res.json({ message: `Motor speed ${speed} sent` });
  });

// 🔹 API reitti, joka palauttaa viimeisimmän tiedon
app.get("/api/relay-status", (req, res) => {
  res.json({ relayStatus });
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

// // Hae käyttäjän laitteet
// app.get('/api/devices/:userId', (req, res) => {
//     const userId = req.params.userId;

//     db.execute('SELECT * FROM devices WHERE user_id = ?', [userId])
//         .then(([rows]) => res.json({ devices: rows }))
//         .catch(err => res.status(500).json({ error: err.message }));
// });

// Esimerkin vuoksi, jos haluat testata perusendpointtia:
app.get('/', (req, res) => {
    res.send('<h1>Hello from Node.js + Express + WebSocket!</h1>');
  });
  


// --- KÄYNNISTETÄÄN SERVERI ---
// HUOM: Emme käytä app.listen(...) vaan server.listen(...)


server.listen(process.env.PORT, () => {
  console.log(`Server listening on port `);
});
