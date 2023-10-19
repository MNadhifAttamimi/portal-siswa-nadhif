const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: String,
    displayName: String,
    NIS: { type: String, unique: true },
    password: String,
    token: String,
    status: { type: String, default: 'aktif' },
    role: { type: String, default: 'siswa' },
});

module.exports = mongoose.model('User', userSchema);
