const express = require('express');
const app = express();
const port = 3000;
const TransactionType = {
    DEBIT: 'debit',
    CREDIT: 'credit'
};

app.use(express.json()); // Menggunakan middleware json
app.use(express.urlencoded({ extended: false })); // Menggunakan middleware urlencoded

const mysql = require('mysql2');
const nodemon = require('nodemon');

const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'bangking_db'
}).promise()

app.get('/api/accounts', async (req, res) => {
    try {
        const [results] = await pool.execute('SELECT * FROM accounts');

        res.status(200).json({
            message: 'Menampilkan semua data akun',
            data: results
        })
    } catch (error) {
        res.status(500).json({
            message: error
        })
    }

})

app.post('/api/accounts', async (req, res) => {
    try {
        const [results] = await pool.execute("INSERT INTO accounts (name) VALUES (?)", [req.body.name])
        console.log(results.insertId)
        const [newResults] = await pool.execute("SELECT * FROM accounts WHERE id = ?", [results.insertId])
        res.status(201).json({
            message: "Berhasil membuat data akun baru",
            data: newResults[0]
        });
    } catch (error) {
        res.status(500).json({
            message: error
        })
    }
});

app.delete('/api/accounts/:id', async (req, res) => {
    try {
        const [results] = await pool.execute("DELETE FROM accounts WHERE id = ?", [req.params.id]);
        if (results.affectedRows == 0) {
            res.status(404).json({
                message: 'data tida ditemukan'
            })
            return;
        }
        res.status(200).json({
            message: 'Berhasil menghapus data',
            data:results
        });
    } catch (error) {
        res.status(500).json({
            message: error
        })
    }

});

app.put('/api/accounts/:id', async (req, res) => {
    const [result] = await pool.execute("UPDATE accounts SET name = ? WHERE id = ?", [req.body.name, req.params.id]);
    const [newResult] = await pool.execute("SELECT * FROM accounts WHERE id = ?", [req.params.id])
    res.status(200).json({
        message : 'Berhasil melakukan update data',
        data : newResult[0]
    });
});

app.put('/api/accounts/:id/top-up', async (req, res) => {
    const [results] = await pool.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", [req.body.amount, req.params.id]);
    const [newResults] = await pool.execute('SELECT * FROM accounts WHERE id = ?', [req.params.id])
    res.status(200).json({
        message: 'Berhasil melakukan top up',
        data: newResults[0]
    })
})

app.post('/api/transactions', async (req, res) => {
    try {
        if (req.body.type === TransactionType.DEBIT) {
            // Implementasi transaksi debit (uang keluar)
            const account_id = req.body.account_id;
            const amount = req.body.amount;

            // Mengambil saldo saat ini
            const [accountResult] = await pool.execute("SELECT balance FROM accounts WHERE id = ?", [account_id]);

            if (accountResult.length > 0) {
                const currentBalance = accountResult[0].balance;

                if (currentBalance >= amount) {
                    // Menyimpan transaksi debit
                    const [debitTransaction] = await pool.execute("INSERT INTO transactions (account_id, type, amount) VALUES (?, ?, ?)", [account_id, TransactionType.DEBIT, amount]);

                    // Mengurangi saldo akun
                    await pool.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, account_id]);

                    const [d] = await pool.execute("SELECT * FROM transactions WHERE id = ?", [debitTransaction.insertId]);

                    res.status(201).json({
                        message: 'Berhasil menyimpan transaksi debit',
                        data: d[0]
                    });
                } else {
                    res.status(403).json({
                        message: 'Saldo tidak mencukupi untuk melakukan transaksi debit'
                    });
                }
            } else {
                res.status(404).json({
                    message: 'Akun tidak ditemukan'
                });
            }
        } else if (req.body.type === TransactionType.CREDIT) {
            // Implementasi transaksi kredit (uang masuk)
            const account_id = req.body.account_id;
            const amount = req.body.amount;

            // Menyimpan transaksi kredit
            const [creditTransaction] = await pool.execute("INSERT INTO transactions (account_id, type, amount) VALUES (?, ?, ?)", [account_id, TransactionType.CREDIT, amount]);

            // Menambahkan saldo akun
            await pool.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, account_id]);

            const [b] = await pool.execute("SELECT * FROM transactions WHERE id = ?", [creditTransaction.insertId]);
            res.status(201).json({
                message: 'Berhasil menyimpan transaksi kredit',
                data: b[0]
            });
        } else {
            res.status(400).json({
                message: 'Jenis transaksi tidak valid'
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

app.get('/api/transactions', async (req, res) => {
    try {
        const [results] = await pool.execute('SELECT * FROM transactions');
        res.status(200).json({
            message: 'Menampilkan semua transaksi',
            data: results
        });
    } catch (error) {
        res.status(500).json({
            message: error
        });
    }
});



app.delete('/api/transactions/:id', async (req, res) => {
    try {
        // Mengambil informasi transaksi berdasarkan ID
        const [transactionResult] = await pool.execute("SELECT * FROM transactions WHERE id = ?", [req.params.id]);

        if (transactionResult.length === 0) {
            res.status(404).json({
                message: 'Transaksi tidak ditemukan'
            });
            return;
        }

        const transaction = transactionResult[0];
        const account_id = transaction.account_id;
        const transactionType = transaction.type;
        const amount = transaction.amount;

        // Menghapus transaksi
        const [deleteResult] = await pool.execute("DELETE FROM transactions WHERE id = ?", [req.params.id]);

        if (transactionType === TransactionType.DEBIT) {
            // Jika transaksi debit yang dihapus, kembalikan saldo ke akun
            await pool.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, account_id]);
        } else if (transactionType === TransactionType.CREDIT) {
            // Jika transaksi kredit yang dihapus, kurangi saldo akun
            await pool.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, account_id]);
        }

        res.status(200).json({
            message: 'Berhasil menghapus transaksi',
            data: deleteResult
        });
    } catch (error) {
        res.status(500).json({
            message: error
        });
    }
});




app.listen(port, (err) => {
    if (err) {
        console.log('Gagal terhubung ke DB');
        console.log(err);
    } else {
        console.log(`Example app listening on port ${port}!`)
    }
});