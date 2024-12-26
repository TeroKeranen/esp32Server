require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/user')


const router = express.Router();


// // Hae käyttäjän laitteet
// app.get('/api/devices/:userId', (req, res) => {
//     const userId = req.params.userId;

//     db.execute('SELECT * FROM devices WHERE user_id = ?', [userId])
//         .then(([rows]) => res.json({ devices: rows }))
//         .catch(err => res.status(500).json({ error: err.message }));
// });


router.get('/api/devices/:userId', async (req,res) => {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({error: "Missing userId"})
    }
    
    try {
        const objectId = new mongoose.Types.ObjectId(userId);
        const user = await User.findById(objectId);

        if (!user) {
            return res.status(404).json({error: 'User not found'});
        }
        console.log("User informations: ", user.spaces);
        res.send(user.spaces)
        
    } catch (error) {
        
    }
})

// tallenna laite käyttäjälle
router.post('/api/device', async (req,res) => {
    const { userId, deviceId, name, type, status } = req.body;
    
    console.log("lähetetään tiedot: ", userId, deviceId, name);

    if (!userId || !deviceId || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await User.findOneAndUpdate(
            { _id: userId, "spaces.name": "Default Space" },
            {
                $push: { "spaces.$.devices": { name, type, status, deviceId } }
            },
            { new: true, upsert: true }
        );

        if (!result) {
            return res.status(404).json({ error: 'User or Space not found' });
        }

        console.log("Device added with findOneAndUpdate:", result);
        res.status(201).json({ message: "Device added successfully", user: result });
    } catch (error) {
        console.error("Error adding device:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }

})

// // Tallenna laite käyttäjälle
// app.post('/api/device', (req, res) => {
//     const { userId, deviceId, ssid } = req.body;

//     console.log("lähetetään tiedot: ", userId, deviceId, ssid);

//     db.execute('INSERT INTO devices (user_id, device_id, ssid) VALUES (?, ?, ?)', [userId, deviceId, ssid])
//         .then(() => res.status(201).json({ message: "Device registered successfully" }))
//         .catch(err => res.status(500).json({ error: err.message }));
// });

module.exports = router;