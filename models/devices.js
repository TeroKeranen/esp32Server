const db = require('../util/database');


module.exports = class devices {
    constructor(id, name, mac) {
        this.id = id;
        this.name = name;
        this.mac = mac;
    }

    static fetchAll () {
        db.execute('SELECT * FROM devices');
    }
}