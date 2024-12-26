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
        
        // Muunna MongoDB-objekti puhtaaksi JSON:ksi
        const spaces = user.spaces.map(space => {
            return {
                ...space.toObject(),  // Muuttaa Mongoose-objektin puhtaaksi JSON:ksi
                devices: space.devices.map(device => device.toObject())  // Muunnetaan myös devices-array
            };
        });

        console.log("Formatted User Data: ", spaces);  // Tarkista että laite näkyy oikein
        res.json(spaces);  // Palauta puhdas JSON
        
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
            { new: true }
        );

        // Jos päivitystä ei tehty (koska "Default Space" puuttuu), luodaan uusi space
        if (!result) {
            console.log("Default Space not found. Creating...");

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Luo uusi space ja lisää laite
            const newSpace = {
                name: 'Default Space',
                devices: [{ name, type, status, deviceId }]
            };

            user.spaces.push(newSpace);
            await user.save();
            return res.status(201).json({ message: "New space created, device added", user });
        }

        console.log("Device added to existing space:", result);
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