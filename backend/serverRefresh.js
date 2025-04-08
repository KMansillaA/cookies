// Cargar variables de entorno desde .env
require("dotenv").config();

// Importar las dependencias necesarias
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { Pool } = require("pg");

// Crear la aplicación Express
const app = express();

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ejAuth",
  password: "123456789",
  port: 5432,
});

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// Claves secretas
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || "secreto";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_SECRET || "refreshsecreto";

// Expiración de tokens
const ACCESS_TOKEN_EXPIRATION = "30s";
const REFRESH_TOKEN_EXPIRATION = "1m";

// Guardar refresh token en la base de datos
const saveRefreshToken = async (userId, token) => {
  await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
  await pool.query("INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)", [userId, token]);
};

// Obtener refresh token guardado
const getStoredRefreshToken = async (userId) => {
  const result = await pool.query("SELECT token FROM refresh_tokens WHERE user_id = $1", [userId]);
  return result.rows.length > 0 ? result.rows[0].token : null;
};

// Eliminar refresh token
const deleteRefreshToken = async (userId) => {
  await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
};

// Middleware para verificar access token
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "No autorizado" });

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token inválido" });
    req.user = user;
    next();
  });
};

// Registro de usuarios
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: "Faltan datos" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username",
    [username, hashedPassword]
  );

  res.status(201).json(result.rows[0]);
});

// Login - generar tokens y guardarlos en cookies
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

  if (result.rows.length === 0) return res.status(401).json({ message: "Usuario no encontrado" });

  const user = result.rows[0];
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(401).json({ message: "Contraseña incorrecta" });

  const accessToken = jwt.sign({ id: user.id, username: user.username }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRATION,
  });

  const refreshToken = jwt.sign({ id: user.id, username: user.username }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRATION,
  });

  await saveRefreshToken(user.id, refreshToken);

  res.cookie("token", accessToken, { httpOnly: true, secure: false });
  res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false });

  res.json({ message: "Autenticación exitosa", username: user.username });
});

// Ruta protegida
app.get("/profile", authenticateToken, (req, res) => {
  res.json({ message: "Acceso permitido", user: req.user });
});

// Refrescar token de acceso
app.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: "Refresh token requerido" });

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err, user) => {
    if (err) return res.status(403).json({ message: "Token inválido" });

    const storedToken = await getStoredRefreshToken(user.id);
    if (!storedToken || storedToken !== refreshToken) {
      await deleteRefreshToken(user.id);
      res.clearCookie("token");
      res.clearCookie("refreshToken");
      return res.status(403).json({ message: "Uso indebido del refresh token" });
    }

    const newAccessToken = jwt.sign(
      { id: user.id, username: user.username },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRATION }
    );

    res.cookie("token", newAccessToken, { httpOnly: true, secure: false });
    res.json({ message: "Token renovado" });
  });
});

// Logout
app.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
      await deleteRefreshToken(decoded.id);
    } catch (e) {
      // Token inválido
    }
  }

  res.clearCookie("token");
  res.clearCookie("refreshToken");
  res.json({ message: "Sesión cerrada" });
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
