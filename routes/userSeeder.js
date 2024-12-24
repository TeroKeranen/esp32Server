require("dotenv").config({path: '../.env'});
const mongoose = require('mongoose');
const User = require('../models/user')

mongoose.connect(process.env.DATABASE_URL)

console.log("mongouri", process.env.DATABASE_URL);

const createTestUser = async () => {
    try {
        const newUser = new User({
            email: "testi@testi.fi",
            password: "testi",
            spaces: [
                {
                    name: "Test Space",
                    description: 'this is a test space',
                    devices: []
                }
            ]
        })

        await newUser.save();
        mongoose.connection.close();
    } catch (error) {
        console.error('Error creating test user:', error);
        mongoose.connection.close();
    }
}
createTestUser();