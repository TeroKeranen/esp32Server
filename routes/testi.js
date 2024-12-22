const express = require('express');
const db = require('../util/database')
const WebSocket = require('ws');

const router = express.Router();

//router.post
//router.get

// router.use('/', (req,res) => {
//     res.send(
//         '<h1>hello</h1>'
//     )
// })

// Tallenna laite käyttäjälle
router.post('/api/device', (req, res) => {
    const { userId, deviceId, ssid } = req.body;

    console.log("lähetetään tiedot: ", userId, deviceId, ssid);

    db.execute('INSERT INTO devices (user_id, device_id, ssid) VALUES (?, ?, ?)', [userId, deviceId, ssid])
        .then(() => res.status(201).json({ message: "Device registered successfully" }))
        .catch(err => res.status(500).json({ error: err.message }));
});

// haetaan käyttäjän laitteet

router.get('/api/devices/:userId', (req,res) => {
    const userId = req.params.userId;

    db.execute('SELECT * FROM devices WHERE user_id = ?', [userId])
        .then(([rows]) => res.json({devices: rows}))
        .catch(err => res.status(500).json({error: err.message}));
})


module.exports = router;