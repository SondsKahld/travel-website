const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// الاتصال بقاعدة البيانات
const db = new sqlite3.Database('./travel.db', (err) => {
    if (err) {
        console.error('خطأ في الاتصال بقاعدة البيانات:', err.message);
    } else {
        console.log('تم الاتصال بقاعدة بيانات SQLite بنجاح.');
    }
});

// إنشاء جدول الحجوزات
db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientName TEXT NOT NULL,
    clientPhone TEXT NOT NULL,
    destination TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// 1. استقبال الحجوزات الجديدة
app.post('/api/book', (req, res) => {
    const { clientName, clientPhone, destination } = req.body;
    if (!clientName || !clientPhone || !destination) {
        return res.status(400).json({ success: false, message: 'الرجاء ملء جميع الحقول المطلوبة' });
    }

    const query = `INSERT INTO bookings (clientName, clientPhone, destination) VALUES (?, ?, ?)`;
    db.run(query, [clientName, clientPhone, destination], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'حدث خطأ في قاعدة البيانات' });
        }
        res.json({ success: true, message: 'تم الحجز بنجاح!', bookingId: this.lastID });
    });
});

// 2. جلب الحجوزات للوحة التحكم
app.get('/api/bookings', (req, res) => {
    db.all(`SELECT * FROM bookings ORDER BY id DESC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'فشل في جلب البيانات' });
        }
        res.json({ success: true, bookings: rows });
    });
});

// 3. حذف حجز
app.delete('/api/book/:id', (req, res) => {
    const bookingId = req.params.id;
    db.run(`DELETE FROM bookings WHERE id = ?`, [bookingId], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'فشل في حذف الحجز' });
        }
        res.json({ success: true, message: 'تم حذف الحجز بنجاح' });
    });
});

// 4. مسار تسجيل دخول المسؤول (Admin Login API)
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    // بيانات المسؤول الافتراضية
    if (username === 'admin' && password === '12345') {
        res.json({ success: true, message: 'تم تسجيل الدخول بنجاح' });
    } else {
        res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
    }
});

app.listen(PORT, () => {
    console.log(`الخادم يعمل حالياً على الرابط: http://localhost:${PORT}`);
})