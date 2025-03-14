const express = require("express");
const mysql = require("mysql2/promise"); // Используем промис-совместимую версию
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const puppeteer = require("puppeteer");
const axios = require("axios");
const app = express();
const githubRoutes = require('./routes/github');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Добавляем модуль для работы с файловой системой

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('WebSocket клиент подключен');

    ws.on('message', (message) => {
        console.log('Получено сообщение от клиента:', message);
    });

    ws.on('close', () => {
        console.log('WebSocket клиент отключен');
    });
});

// WebSocket уведомление
const notifyClients = (notification) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(notification));
        }
    });
};

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/news', express.static(path.join(__dirname, 'uploads', 'news')));
app.use('/uploads/posts', express.static(path.join(__dirname, 'uploads', 'posts')));

app.use('/github', githubRoutes);


// Логирование запросов
app.use((err, req, res, next) => {
    console.log(`Request URL: ${req.url}`);  // Логируем путь запроса
    next();
    console.error(err.stack);
    res.status(500).json({ message: 'Ошибка сервера' });
});

// Разрешаем CORS для всех доменов
app.use(cors({
    origin: '*',  // Разрешаем доступ с любых источников
    optionsSuccessStatus: 200,  // Для старых браузеров
    methods: 'GET,POST, PATCH, PUT,DELETE',  // Разрешенные методы
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true, // Разрешенные заголовки
}));

app.use(express.json()); // Для обработки JSON-запросов

// Подключение к базе данных с использованием промисов
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Вспомогательная функция для генерации токена
const generateToken = (user) => {
    return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES,
    });
};

// Middleware для проверки токена
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Токен не предоставлен' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded user:', decoded); // Логируем декодированный токен
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Ошибка токена:', error);
        return res.status(401).json({ message: 'Неверный токен' });
    }
};


const verifyAdmin = (req, res, next) => {
    console.log('User role:', req.user.role); // Логируем роль пользователя
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Доступ запрещен. Вы не администратор.' });
    }
    next();
};


// Маршрут для получения списка пользователей
app.get("/users", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Необходима авторизация" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const [users] = await db.query(
            "SELECT id, username, github_username, avatar, skills FROM users WHERE id != ? ",
            [userId]
        );

        // Получаем статус дружбы для каждого пользователя
        const friendStatusQuery = `
            SELECT friend_id, status 
            FROM friends 
            WHERE user_id = ? AND friend_id IN (?);
        `;
        const friendStatusResult = await db.query(friendStatusQuery, [
            userId,
            users.map(user => user.id),
        ]);

        // Обновляем список пользователей с соответствующим статусом дружбы
        const usersWithStatus = users.map(user => {
            const friendship = friendStatusResult.find(status => status.friend_id === user.id);
            if (friendship) {
                user.friendshipStatus = friendship.status;
            } else {
                user.friendshipStatus = "none"; // Если нет записи, то статус "none"
            }
            return user;
        });

        res.json(usersWithStatus);

    } catch (error) {
        console.error("Ошибка при получении пользователей:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});


app.post("/add-friend", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Необходима авторизация" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const { friendId } = req.body;

        if (!friendId) {
            return res.status(400).json({ message: "Не указан ID друга" });
        }

        // Проверяем, нет ли уже заявки или дружбы
        const [existing] = await db.query(
            "SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
            [userId, friendId, friendId, userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Заявка уже отправлена или дружба уже установлена" });
        }

        // Создаём заявку
        await db.query("INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'pending')", [userId, friendId]);

        res.json({ message: "Заявка отправлена" });

    } catch (error) {
        console.error("Ошибка при отправке заявки в друзья:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});


// Маршрут для получения списка друзей
app.get("/friends", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Необходима авторизация" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Получаем друзей в обе стороны (и тех, кого добавил userId, и тех, кто добавил userId)
        const [friends] = await db.query(
            `SELECT u.id, u.username, u.avatar 
            FROM users u 
            JOIN friends f ON (u.id = f.friend_id AND f.user_id = ?) 
                OR (u.id = f.user_id AND f.friend_id = ?) 
            WHERE f.status = 'accepted'`,
            [userId, userId]
        );

        res.json(friends);
    } catch (error) {
        console.error("Ошибка при получении списка друзей:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});



app.get('/friend-requests', async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Необходима авторизация" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Получаем только заявки на добавление в друзья (статус "pending")
        const [requests] = await db.query(
            `SELECT 
                f.user_id, f.friend_id, f.status,
                u1.username AS user_name, u2.avatar AS avatar, u2.username AS friend_name
            FROM friends f
            JOIN users u1 ON f.user_id = u1.id
            JOIN users u2 ON f.friend_id = u2.id
            WHERE f.friend_id = ? AND f.status = 'pending'`,
            [userId]
        );



        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


// Маршрут для добавления в друзья
app.patch("/friend-requests/accept/:friendId", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Необходима авторизация" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const friendId = req.params.friendId;

        if (!friendId) {
            return res.status(400).json({ message: "Не указан ID друга" });
        }

        // Обновляем статус на "accepted"
        const [result] = await db.query(
            "UPDATE friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ? OR user_id = ? AND friend_id = ?",
            [userId, friendId, friendId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Заявка не найдена" });
        }

        res.json({ message: "Заявка принята" });

    } catch (error) {
        console.error("Ошибка при принятии заявки:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});

app.patch("/friend-requests/reject/:friendId", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Необходима авторизация" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        const friendId = req.params.friendId;

        if (!friendId) {
            return res.status(400).json({ message: "Не указан ID друга" });
        }

        // Удаляем запись о заявке
        const [result] = await db.query(
            "DELETE FROM friends WHERE user_id = ? AND friend_id = ? OR user_id = ? AND friend_id = ?",
            [userId, friendId, friendId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Заявка не найдена" });
        }

        res.json({ message: "Заявка отклонена" });

    } catch (error) {
        console.error("Ошибка при отклонении заявки:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});






const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let destinationPath;
        if (req.url.includes('/avatars')) {
            destinationPath = 'uploads/avatars';
        } else if (req.url.includes('/news')) {
            destinationPath = 'uploads/news';
        } else if (req.url.includes('/posts')) {
            destinationPath = 'uploads/posts';
        } else {
            destinationPath = 'uploads'; // Default destination
        }
        cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });


app.get('/admin/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [results] = await db.query("SELECT id, username, email, role, isBlocked FROM users WHERE role = 'user' ");
        res.status(200).json(results);
    } catch (err) {
        console.error('Ошибка при загрузке пользователей:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Блокировка пользователя
app.patch('/users/:id/block', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // Находим пользователя по ID
        const [users] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const user = users[0];

        // Проверяем, не заблокирован ли пользователь уже
        if (user.isBlocked === 'заблокирован') {
            return res.status(400).json({ message: 'Пользователь уже заблокирован' });
        }

        // Блокируем пользователя
        await db.query("UPDATE users SET isBlocked = 'заблокирован' WHERE id = ?", [id]);

        res.status(200).json({ message: 'Пользователь заблокирован' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка при блокировке пользователя' });
    }
});

// Разблокировка пользователя
app.patch('/users/:id/unblock', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // Находим пользователя по ID
        const [users] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const user = users[0];

        // Проверяем, не разблокирован ли уже пользователь
        if (user.isBlocked === 'активен') {
            return res.status(400).json({ message: 'Пользователь уже активен' });
        }

        // Разблокируем пользователя
        await db.query("UPDATE users SET isBlocked = 'активен' WHERE id = ?", [id]);

        res.status(200).json({ message: 'Пользователь разблокирован' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка при разблокировке пользователя' });
    }
});



// Удаление пользователя
app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        // Находим пользователя по ID
        const [users] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        // Удаляем пользователя
        await db.query("DELETE FROM users WHERE id = ?", [id]);

        res.status(200).json({ message: 'Пользователь удалён' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка при удалении пользователя' });
    }
});

app.patch('/admin/news/:id/status', verifyToken, verifyAdmin, async (req, res) => {
    const { status } = req.body;
    const newsId = req.params.id;

    if (!status || !['ожидание', 'принят', 'отклонен'].includes(status)) {
        return res.status(400).json({ message: 'Неверный статус' });
    }

    try {
        const [result] = await db.query('UPDATE news SET status = ? WHERE id = ?', [status, newsId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Новость не найдена' });
        }
        res.json({ message: 'Статус новости обновлен' });
    } catch (err) {
        console.error('Ошибка при обновлении статуса новости:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

app.patch('/admin/posts/:id/status', verifyToken, verifyAdmin, async (req, res) => {
    const { status } = req.body;
    const postId = req.params.id;

    if (!status || !['ожидание', 'принят', 'отклонен'].includes(status)) {
        return res.status(400).json({ message: 'Неверный статус' });
    }

    try {
        const [result] = await db.query('UPDATE posts SET status = ? WHERE id = ?', [status, postId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Пост не найден' });
        }
        res.json({ message: 'Статус поста обновлен' });
    } catch (err) {
        console.error('Ошибка при обновлении статуса поста:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});


// Статистика пользователей
app.get('/admin/statistics', verifyToken, verifyAdmin, async (req, res) => {
    const { filter } = req.query; // Получаем фильтр из query-параметров

    let dateGroupBy = 'MONTH(created_at)';
    if (filter === 'day') {
        dateGroupBy = 'DATE(created_at)';
    } else if (filter === 'week') {
        dateGroupBy = 'YEARWEEK(created_at)';
    } else if (filter === 'year') {
        dateGroupBy = 'YEAR(created_at)';
    }

    try {
        // Получаем количество пользователей
        const [totalUsersResult] = await db.query(`
        SELECT COUNT(*) AS totalUsers FROM users
      `);
        const totalUsers = totalUsersResult[0].totalUsers;

        // Получаем данные для графика
        const [results] = await db.query(`
        SELECT 
            ${dateGroupBy} as date,
            COUNT(*) as user_count
        FROM users
        GROUP BY ${dateGroupBy}
        ORDER BY date
      `);

        // Формируем метки и данные для графика
        const labels = results.map(result => result.date);
        const newUsers = results.map(result => result.user_count);

        res.json({ newUsers, labels, totalUsers });
    } catch (err) {
        console.error('Ошибка при получении статистики:', err);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});





app.get('/hackathons', async (req, res) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        await page.goto('https://hackathons.pro/', { waitUntil: 'networkidle2', timeout: 60000 });

        // Пролистываем страницу, чтобы загрузить ленивые изображения
        await page.evaluate(async () => {
            const distance = 100; // Расстояние прокрутки
            const delay = 100;   // Задержка между прокрутками
            while (document.body.scrollHeight > window.scrollY + window.innerHeight) {
                window.scrollBy(0, distance);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        });

        // Ожидаем загрузки всех изображений
        await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'));
            return Promise.all(images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => img.onload = resolve);
            }));
        });

        // Извлекаем HTML блока с хакатонами
        const htmlContent = await page.evaluate(() => {
            const block = document.querySelector('.js-feed.t-feed.t-feed_col');
            return block ? block.outerHTML : null;
        });

        // Извлекаем ссылки на изображения
        const imageLinks = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('.js-feed.t-feed.t-feed_col img'));
            const backgrounds = Array.from(document.querySelectorAll('.js-feed.t-feed.t-feed_col'));

            const imgLinks = images.map(img => img.dataset.src || img.src); // Либо data-src, либо src
            const bgLinks = backgrounds.map(el => {
                const bgStyle = window.getComputedStyle(el).backgroundImage;
                return bgStyle && bgStyle !== 'none'
                    ? bgStyle.replace(/^url\(["']?/, '').replace(/["']?\)$/, '')
                    : null;
            });

            return [...imgLinks, ...bgLinks.filter(Boolean)]; // Убираем пустые значения
        });

        // Извлекаем ссылки на CSS стили
        const cssContent = await page.evaluate(() => {
            const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
            return styles.map(style => style.href); // Возвращаем ссылки на CSS
        });

        if (!htmlContent) {
            res.status(404).json({ message: 'Блок с хакатонами не найден.' });
        } else {
            res.json({ html: htmlContent, css: cssContent, images: imageLinks });
        }
    } catch (err) {
        console.error('Ошибка при парсинге:', err);
        res.status(500).json({ message: 'Ошибка при загрузке данных' });
    } finally {
        await browser.close();
    }
});


// Регистрация пользователя
app.post('/register', async (req, res) => {
    const { username, email, password, github_username } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Поля username, email и password обязательны!' });
    }

    try {
        // Проверка на существующего пользователя с таким email
        const [existingUserEmail] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        const [existingUserGitHub] = await db.query('SELECT id FROM users WHERE github_username = ?', [github_username]);
        if (existingUserEmail.length > 0) {
            return res.status(400).json({ message: 'Пользователь с таким email уже существует!' });
        } else if (existingUserGitHub.length > 0) {
            return res.status(400).json({ message: 'Пользователь с таким GitHub Username уже существует!' });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);

        // Вставка нового пользователя в базу данных
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, github_username) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, github_username || null]
        );

        // Получаем репозитории с GitHub, если github_username передан
        let repositories = [];
        if (github_username) {
            repositories = await fetchRepositories(github_username); // Получаем репозитории с GitHub
        }

        // Сохраняем репозитории в базу данных
        const lastSynced = new Date().toISOString().slice(0, 19).replace('T', ' ');

        for (const repo of repositories) {
            console.log('Сохраняем репозиторий:', repo);  // Логирование каждого репозитория
            await db.query(
                'INSERT INTO repositories (user_id, repo_name, repo_url, last_synced) VALUES (?, ?, ?, ?)',
                [result.insertId, repo.name, repo.html_url, lastSynced]
            );
        }



        // Генерация JWT токена
        const token = generateToken({ id: result.insertId, username, email });

        res.status(201).json({ message: 'Пользователь успешно зарегистрирован!', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера при регистрации' });
    }
});

// Функция для получения репозиториев с GitHub
const fetchRepositories = async (githubUsername) => {
    try {
        const response = await axios.get(`https://api.github.com/users/${githubUsername}/repos`);
        console.log("GitHub Repositories:", response.data);  // Логируем полученные репозитории
        return response.data;
    } catch (error) {
        console.error('Ошибка при получении репозиториев с GitHub:', error.message);
        return [];
    }
};



app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Поля email и password обязательны!' });
    }

    try {
        const [users] = await db.query('SELECT id, email, username, role, password, isBlocked FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Пользователь не найден!' });
        }

        if (users[0].isBlocked === 'заблокирован') {
            return res.status(403).json({ message: 'Ваш аккаунт заблокирован!' }); // Новый статус для заблокированных пользователей
        }

        const validPassword = await bcrypt.compare(password, users[0].password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Неверный пароль!' });
        }

        const token = jwt.sign(
            {
                id: users[0].id,
                email: users[0].email,
                username: users[0].username,
                role: users[0].role || 'user',
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES }
        );

        res.json({
            token,
            user: {
                id: users[0].id,
                username: users[0].username,
                role: users[0].role || 'user',
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});



// Маршрут для получения профиля текущего пользователя
app.get('/profile', verifyToken, async (req, res) => {
    const { id } = req.user;

    try {
        const [user] = await db.query(
            'SELECT id, username, email, github_username, avatar, skills FROM users WHERE id = ?',
            [id]
        );

        if (user.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const profile = user[0];
        let repositories = [];

        if (profile.github_username) {
            try {
                const { data } = await axios.get(
                    `https://api.github.com/users/${profile.github_username}/repos`,
                    {
                        headers: {
                            Authorization: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
                        },
                    }
                );

                repositories = data.map(repo => ({
                    name: repo.name,
                    commits: repo.size, // Размер в GitHub API можно использовать как количество коммитов
                }));
            } catch (githubError) {
                console.error('Ошибка при получении репозиториев GitHub:', githubError.message);
            }
        }

        res.status(200).json({ user: profile, repositories });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка при получении профиля' });
    }
});

// Обновление профиля пользователя
app.put('/profile/update', verifyToken, upload.single('avatar'), async (req, res) => {
    const { id } = req.user;
    const { username, github_username, skills, email } = req.body;
    const avatar = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        if (github_username !== undefined) {
            const [existingUser] = await db.query(
                'SELECT id FROM users WHERE github_username = ? AND id != ?',
                [github_username, id]
            );
            if (existingUser.length > 0) {
                return res.status(400).json({ message: 'Этот GitHub username уже используется другим пользователем' });
            }
        }

        const updateFields = [];
        const values = [];

        if (username) updateFields.push('username = ?'), values.push(username);
        if (github_username !== undefined) updateFields.push('github_username = ?'), values.push(github_username.trim() === '' ? null : github_username);
        if (skills) updateFields.push('skills = ?'), values.push(skills);
        if (email) updateFields.push('email = ?'), values.push(email);
        if (avatar) updateFields.push('avatar = ?'), values.push(avatar);

        values.push(id);

        if (updateFields.length > 0) {
            await db.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, values);
        }

        res.status(200).json({ message: 'Профиль успешно обновлен' });
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        res.status(500).json({ message: 'Ошибка сервера' });
    }
});

// Удаление аватара пользователя
app.delete('/profile/avatar', verifyToken, async (req, res) => {
    const { id } = req.user;

    try {
        // Получаем текущего пользователя
        const [user] = await db.query('SELECT avatar FROM users WHERE id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const avatarPath = user[0].avatar ? path.join(__dirname, user[0].avatar) : null;

        if (avatarPath && fs.existsSync(avatarPath)) {
            // Удаляем файл аватара
            fs.unlinkSync(avatarPath);
        }

        // Обновляем запись в базе данных
        await db.query('UPDATE users SET avatar = NULL WHERE id = ?', [id]);

        res.status(200).json({ message: 'Аватар удален успешно' });
    } catch (error) {
        console.error('Ошибка при удалении аватара:', error);
        res.status(500).json({ message: 'Ошибка при удалении аватара' });
    }
});

// Маршрут для получения профиля другого пользователя
app.get('/users/:username', async (req, res) => {
    const { username } = req.params;
    const decodedUsername = decodeURIComponent(username); // Декодируем имя пользователя

    try {
        // Находим пользователя в базе данных
        const [user] = await db.query(
            'SELECT id, username, email, github_username, avatar, skills FROM users WHERE username = ?',
            [decodedUsername]
        );

        if (user.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        const profile = user[0];
        let repositories = [];

        // Загружаем репозитории с GitHub
        if (profile.github_username) {
            try {
                const { data } = await axios.get(
                    `https://api.github.com/users/${profile.github_username}/repos`,
                    {
                        headers: {
                            Authorization: `token ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
                        },
                    }
                );

                repositories = data.map(repo => ({
                    name: repo.name,
                    commits: repo.size, // Размер в GitHub API можно использовать как количество коммитов
                }));
            } catch (githubError) {
                console.error('Ошибка при получении репозиториев GitHub:', githubError.message);
            }
        }

        res.status(200).json({ user: profile, repositories });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка при получении профиля' });
    }
});


// Защищенный маршрут для получения списка пользователей
app.get('/all-users', verifyToken, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, email, github_username, avatar, skills FROM users');
        res.status(200).json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка сервера при получении пользователей' });
    }
});

app.get('/chats', verifyToken, async (req, res) => {
    const { id } = req.user;
    try {
        const [chats] = await db.query(
            `SELECT c.id, u1.username AS user1, u2.username AS user2, c.created_at
            FROM chats c
            JOIN users u1 ON c.user_id_1 = u1.id
            JOIN users u2 ON c.user_id_2 = u2.id
            WHERE c.user_id_1 = ? OR c.user_id_2 = ?`,
            [id, id]
        );
        res.json(chats);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка при получении чатов' });
    }
});


// Пример вызова notifyClients при новом сообщении
app.post('/messages', verifyToken, async (req, res) => {
    const { chatId, message } = req.body;
    const userId = req.user.id;

    if (!chatId) {
        return res.status(400).json({ message: 'chatId отсутствует' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO messages (chat_id, user_id, message, created_at) VALUES (?, ?, ?, NOW())',
            [chatId, userId, message]
        );

        const [user] = await db.query('SELECT username FROM users WHERE id = ?', [userId]);

        const newMessage = {
            id: result.insertId,
            chat_id: chatId,
            user_id: userId,
            message,
            username: user[0].username,
            created_at: new Date(),
            read: false,
        };

        notifyClients({ type: 'NEW_MESSAGE', data: newMessage });

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Ошибка при добавлении сообщения:', error);
        res.status(500).json({ message: 'Ошибка при добавлении сообщения' });
    }
});


app.get('/messages/:chatId', verifyToken, async (req, res) => {
    const { chatId } = req.params;
    try {
        const [messages] = await db.query(
            'SELECT m.*, u.username FROM messages m JOIN users u ON m.user_id = u.id WHERE m.chat_id = ? ORDER BY m.created_at',
            [chatId]
        );
        console.log(messages); // Логирование сообщений
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка при получении сообщений' });
    }
});

app.post('/chats', verifyToken, async (req, res) => {
    const { userId2 } = req.body;
    const { id: userId1 } = req.user;

    try {
        const [existingChat] = await db.query(
            'SELECT * FROM chats WHERE (user_id_1 = ? AND user_id_2 = ?) OR (user_id_1 = ? AND user_id_2 = ?)',
            [userId1, userId2, userId2, userId1]
        );

        if (existingChat.length > 0) {
            return res.status(200).json(existingChat[0]);
        }

        const [result] = await db.query(
            'INSERT INTO chats (user_id_1, user_id_2) VALUES (?, ?)',
            [userId1, userId2]
        );

        res.status(201).json({ id: result.insertId });
    } catch (err) {
        console.error('Ошибка при создании чата:', err);
        res.status(500).json({ message: 'Ошибка при создании чата' });
    }
});



// Эндпоинт для получения репозиториев
app.get('/repositories/:github_username', verifyToken, async (req, res) => {
    const { github_username } = req.params;

    try {
        // Сначала проверим, есть ли уже данные о репозиториях для этого пользователя в базе данных
        const [existingRepos] = await db.query(
            'SELECT * FROM repositories WHERE user_id = (SELECT id FROM users WHERE github_username = ?) ORDER BY last_synced DESC LIMIT 1',
            [github_username]
        );

        // Если данные о репозиториях существуют и они были синхронизированы недавно (например, в последние 24 часа)
        if (existingRepos.length > 0) {
            const lastSynced = new Date(existingRepos[0].last_synced);
            const hoursSinceLastSync = (new Date() - lastSynced) / (1000 * 60 * 60);

            if (hoursSinceLastSync < 24) {
                // Если данные актуальны (менее 24 часов с последнего запроса), возвращаем их
                return res.json(existingRepos.map(repo => ({
                    repo_name: repo.repo_name,
                    repo_url: repo.repo_url,
                    last_synced: repo.last_synced
                })));
            }
        }

        // Если данных нет или они устарели, делаем запрос к GitHub API
        const { data } = await axios.get(`https://api.github.com/users/${github_username}/repos`);

        // Извлекаем данные из GitHub
        const repoData = data.map(repo => ({
            repo_name: repo.name,
            repo_url: repo.html_url,
            last_synced: new Date()
        }));

        // Удаляем старые записи
        await db.query('DELETE FROM repositories WHERE user_id = (SELECT id FROM users WHERE github_username = ?)', [github_username]);

        // Сохраняем новые репозитории в базу данных
        for (const repo of repoData) {
            await db.query(
                'INSERT INTO repositories (user_id, repo_name, repo_url, last_synced) VALUES ((SELECT id FROM users WHERE github_username = ?), ?, ?, ?)',
                [github_username, repo.repo_name, repo.repo_url, repo.last_synced]
            );
        }

        // Возвращаем данные
        res.status(200).json(repoData);

    } catch (error) {
        console.error('Ошибка при получении репозиториев:', error);
        res.status(500).json({ message: 'Ошибка при получении репозиториев' });
    }
});

// Получение всех новостей
app.get("/news", async (req, res) => {
    try {
        const [news] = await db.query(`
            SELECT n.id, n.title, n.description, n.status, n.link, n.image_url, n.author_id, n.created_at, u.username AS user
            FROM news n
            JOIN users u ON n.author_id = u.id
            WHERE n.status = "принят"
        `);
        res.status(200).json(news);
    } catch (error) {
        console.error("Ошибка при получении новостей:", error);
        res.status(500).json({ message: "Ошибка при получении новостей" });
    }
});

// Получение всех новостей для администраторов
app.get("/admin/news", verifyToken, verifyAdmin, async (req, res) => {
    console.log('Получен запрос на новости');
    try {
        const [news] = await db.query(`
            SELECT n.*, u.username AS user
            FROM news n
            JOIN users u ON n.author_id = u.id
            ORDER BY created_at DESC
        `);
        console.log('Новости получены:', news);
        res.status(200).json(news);
    } catch (error) {
        console.error("Ошибка при получении новостей:", error);
        res.status(500).json({ message: "Ошибка при получении новостей" });
    }
});



// Маршрут для добавления новости
app.post("/news", verifyToken, upload.single("file"), async (req, res) => {
    const { title, description, link } = req.body;
    const file = req.file;

    const authorId = req.user.id; // Извлекаем ID пользователя из токена
    const imageUrl = file ? `/uploads/news/${file.filename}` : null;

    try {
        await db.query(
            `INSERT INTO news (title, description, link, image_url, author_id, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'ожидание', NOW())`,
            [title, description, link, imageUrl, authorId]
        );
        res.status(201).json({ message: "Новость добавлена!" });
    } catch (error) {
        console.error("Ошибка при добавлении новости:", error);
        res.status(500).json({ message: "Не удалось добавить новость." });
    }
});

app.delete('/admin/news/:id', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query(`DELETE FROM news WHERE id = ?`, [id]);
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Новость удалена успешно' });
        } else {
            res.status(404).json({ message: 'Новость не найдена' });
        }
    } catch (error) {
        console.error("Ошибка при удалении новости:", error);
        res.status(500).json({ message: 'Ошибка при удалении новости' });
    }
});



// Получение всех постов
app.get("/posts", async (req, res) => {
    try {
        const [posts] = await db.query(`
            SELECT p.id, p.title, p.description, p.status, p.image_url, p.author_id, p.created_at, u.username AS user
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.status = "принят"
        `);
        res.status(200).json(posts);
    } catch (error) {
        console.error("Ошибка при получении постов:", error);
        res.status(500).json({ message: "Ошибка при получении постов" });
    }
});

// Получение всех постов для администраторов
app.get("/admin/posts", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const [posts] = await db.query(`
            SELECT p.*, u.username AS user
            FROM posts p
            JOIN users u ON p.author_id = u.id
            ORDER BY created_at DESC
        `);
        res.status(200).json(posts);
    } catch (error) {
        console.error("Ошибка при получении постов:", error);
        res.status(500).json({ message: "Ошибка при получении постов" });
    }
});


app.post("/posts", verifyToken, upload.single("file"), async (req, res) => {
    const { title, description } = req.body;
    const file = req.file;

    const authorId = req.user.id; // Извлекаем ID пользователя из токена
    const imageUrl = file ? `/uploads/posts/${file.filename}` : null;

    try {
        await db.query(
            `INSERT INTO posts (title, description, image_url, author_id, status, created_at)
            VALUES (?, ?, ?, ?, 'ожидание', NOW())`,
            [title, description, imageUrl, authorId]
        );
        res.status(201).json({ message: "Пост создан!" });
    } catch (error) {
        console.error("Ошибка при добавлении новости:", error);
        res.status(500).json({ message: "Не удалось добавить новость." });
    }
});

app.delete('/admin/posts/:id', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query(`DELETE FROM posts WHERE id = ?`, [id]);
        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Пост успешно удален' });
        } else {
            res.status(404).json({ message: 'Пост не найден' });
        }
    } catch (error) {
        console.error("Ошибка при удалении поста:", error);
        res.status(500).json({ message: 'Ошибка при удалении поста' });
    }
});

// Получение всех вопросов
app.get("/forums", async (req, res) => {
    try {
        const [forums] = await db.query(`
            SELECT f.id, f.user_id, f.question AS title, f.description, f.created_at, f.status, u.username AS user
            FROM forums f
            JOIN users u ON f.user_id = u.id
            ORDER BY f.created_at DESC
        `);
        res.status(200).json(forums);
    } catch (error) {
        console.error("Ошибка при получении вопросов:", error);
        res.status(500).json({ message: "Ошибка при получении вопросов" });
    }
});

// Добавление нового вопроса
app.post('/forums', verifyToken, async (req, res) => {
    const { title, description } = req.body;
    const user_id = req.user.id;  // Берем user_id из данных токена

    if (!user_id) {
        return res.status(400).json({ message: 'user_id обязателен' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO forums (question, description, user_id, created_at, status) VALUES (?, ?, ?, NOW(), ?)',
            [title, description, user_id, 'Открыт']
        );

        const [user] = await db.query('SELECT username FROM users WHERE id = ?', [user_id]);

        res.status(201).json({
            id: result.insertId,
            title,
            description,
            user: user[0].username,  // Возвращаем имя пользователя
            created_at: new Date(),
            status: 'Открыт',
            user_id,
        });
    } catch (error) {
        console.error('Ошибка при добавлении вопроса:', error);
        res.status(500).json({ message: 'Ошибка при добавлении вопроса' });
    }
});



// Получение ответов для вопроса
app.get("/forums/:id/answers", async (req, res) => {
    const { id } = req.params;
    try {
        const [answers] = await db.query(`
            SELECT a.id, a.answer, a.created_at, u.username AS user
            FROM forum_answers a
            JOIN users u ON a.user_id = u.id
            WHERE a.forum_id = ?
            ORDER BY a.created_at ASC
        `, [id]);
        res.status(200).json(answers);
    } catch (error) {
        console.error("Ошибка при получении ответов:", error);
        res.status(500).json({ message: "Ошибка при получении ответов" });
    }
});

// Добавление нового ответа
app.post("/forums/:id/answers", verifyToken, async (req, res) => {
    const { id } = req.params; // ID вопроса
    const { answer } = req.body;
    const userId = req.user.id;

    if (!answer) {
        return res.status(400).json({ message: "Ответ не может быть пустым." });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO forum_answers (forum_id, user_id, answer, created_at) VALUES (?, ?, ?, ?)",
            [id, userId, answer, new Date()]
        );

        const newAnswer = {
            id: result.insertId,
            forum_id: id,
            user_id: userId,
            answer,
            created_at: new Date(),
        };

        res.status(201).json(newAnswer);
    } catch (error) {
        console.error("Ошибка при добавлении ответа:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});


// Обновление статуса вопроса
app.put("/forums/:id/status", verifyToken, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Проверка, что статус допустимый
    if (status !== 'открыт' && status !== 'решён') {
        return res.status(400).json({ message: "Недопустимый статус." });
    }

    try {
        // Проверка, является ли пользователь автором вопроса или администратором
        const [questionOwner] = await db.query(
            'SELECT user_id FROM forums WHERE id = ?',
            [id]
        );

        if (!questionOwner.length) {
            return res.status(404).json({ message: "Вопрос не найден." });
        }

        // Проверка прав доступа (если это не администратор или автор вопроса)
        if (questionOwner[0].user_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "У вас нет прав для изменения статуса вопроса." });
        }

        // Обновляем статус
        const [result] = await db.query(
            "UPDATE forums SET status = ? WHERE id = ?",
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Вопрос не найден." });
        }

        // Получаем обновленные данные вопроса
        const [updatedQuestion] = await db.query(
            'SELECT id, question, description, status, user_id FROM forums WHERE id = ?',
            [id]
        );

        res.status(200).json(updatedQuestion[0]);
    } catch (error) {
        console.error("Ошибка при обновлении статуса:", error);
        res.status(500).json({ message: "Ошибка сервера" });
    }
});



// Старт сервера
app.listen(5000, () => {
    console.log('Server is running on port 5000');
});