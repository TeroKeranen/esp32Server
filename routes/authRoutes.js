require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = mongoose.model('User');


const router = express.Router();


// tallenna laite käyttäjälle
router.post('/api/device', async (req,res) => {
    const { userId, deviceId, name, type, status } = req.body;
    console.log("lähetetään tiedot: ", userId, deviceId, name);

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({error: 'User not found'});


        }

        let space = user.spaces.find(s => s.name === 'Default Space');
        if (!space) {
            space = {
                name: 'Default Space',
                devices: []
            };
            user.spaces.push(space);
        }

        // lisätään uusi laite spacelle
        space.devices.push({
            name,
            type,
            status
        });

        await user.save();
        res.status(201).json({message: "Device added successfully", user})
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