const express = require('express');
const uuid = require('uuid');
const app = express();
const port = 3000;

app.use(express.json());

const users = []; // Objek untuk menyimpan data pengguna

// Mendaftarkan siswa
app.post('/register', (req, res) => {
    const { displayName, NIS, password } = req.body;

    // Validasi data
    if (!displayName || displayName.length < 3 || displayName.length > 20) {
        return res.status(400).json({ message: 'Nama harus memiliki 3-20 karakter' });
    }

    if (!NIS || NIS.length !== 5) {
        return res.status(400).json({ message: 'NIS harus terdiri dari 5 karakter' });
    }

    if (!password || password.length < 6 || password.length > 14) {
        return res.status(400).json({ message: 'Password harus memiliki 6-14 karakter' });
    }

    // Cek apakah NIS sudah terdaftar
    if (users.some((user) => user.NIS === NIS)) {
        return res.status(400).json({ message: 'NIS sudah terdaftar' });
    }

    // Buat UUID, token, dan simpan data
    const id = uuid.v4();
    const token = uuid.v4();
    users.push({ id, displayName, NIS, password, token });

    return res.status(200).json({ message: 'Pendaftaran berhasil' });
});

// Login
app.post('/login', (req, res) => {
    const { NIS, password } = req.body;

    // Validasi data
    if (!NIS || !password) {
        return res.status(400).json({ message: 'NIS dan password diperlukan' });
    }

    const user = users.find((user) => user.NIS === NIS && user.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Login gagal' });
    }

    // Buat dan kirimkan token
    const token = uuid.v4();
    user.token = token;

    return res.status(200).json({ token });
});

// Cek Token
app.post('/check-token', (req, res) => {
    const { token } = req.body;

    const user = users.find((user) => user.token === token);

    if (!user) {
        return res.status(401).json({ message: 'Token tidak valid' });
    }

    // Kirim data pengguna
    const userData = {
        id: user.id,
        displayName: user.displayName,
        NIS: user.NIS,
        status: 'aktif',
        role: 'siswa',
    };

    return res.status(200).json(userData);
});

// Logout
app.post('/logout', (req, res) => {
    const { token } = req.body;

    const user = users.find((user) => user.token === token);

    if (!user) {
        return res.status(401).json({ message: 'Token tidak valid' });
    }

    user.token = ''; // Hapus token

    return res.status(200).json({ message: 'Logout berhasil' });
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});
