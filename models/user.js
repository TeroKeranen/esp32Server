const mongoose = require('mongoose');

const devicesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        
    },
    status: {
        type: String
    },
    deviceId: {
        type: String
    }
}, { _id: false });  // Tämä estää automaattisen _id:n generoinnin subdokumentille)

const spaceSchema = new mongoose.Schema({
    name: {
        type:String
    },
    description: String,
    devices: [devicesSchema]
})

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },

    spaces: [spaceSchema]
    

})


// Luo ja exporttaa malli
const User = mongoose.model('User', userSchema);
module.exports = User;