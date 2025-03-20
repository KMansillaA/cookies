// Cargar las variables de entorno desde un archivo .env
require("dotenv").config();

// Importar las dependencias necesarias
const express = require("express"); // Framework para crear el servidor web
const bcrypt = require("bcryptjs"); // Librería para encriptar y verificar contraseñas
const jwt = require("jsonwebtoken"); // Librería para generar y verificar JSON Web Tokens
const cookieParser = require("cookie-parser"); // Middleware para manejar cookies
const cors = require("cors"); // Middleware para habilitar el uso de CORS (Cross-Origin Resource Sharing)
const { Pool } = require("pg"); // Conexión a PostgreSQL usando el cliente Pool de la librería pg

// Crear una instancia de una aplicación Express
const app = express();

// Crear una nueva instancia de Pool para conectarse a la base de datos PostgreSQL
// Utilizando la cadena de conexión de la base de datos desde el archivo .env
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware para parsear el cuerpo de las peticiones en formato JSON
app.use(express.json());

// Middleware para parsear las cookies de las peticiones HTTP
app.use(cookieParser());

// Middleware CORS para permitir solicitudes desde el frontend ubicado en localhost:5173
// Permite el envío de cookies entre el frontend y el backend
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

// Definir la clave secreta para firmar los JWTs, obtenida desde las variables de entorno
const SECRET_KEY = process.env.JWT_SECRET || "secreto"; // Si no está en .env, se usa "secreto"

// Middleware para verificar si un token JWT es válido
const authenticateToken = (req, res, next) => {
    // Extraer el token de las cookies
    const token = req.cookies.token;
    
    // Si no existe el token, la solicitud está no autorizada
    if (!token) return res.status(401).json({ message: "No autorizado" });

    // Verificar el token usando la clave secreta
    jwt.verify(token, SECRET_KEY, (err, user) => {
        // Si hay un error con la verificación (token inválido), retornar un error 403
        if (err) return res.status(403).json({ message: "Token inválido" });
        
        // Si la verificación es exitosa, añadir la información del usuario al request
        req.user = user;
        
        // Continuar con la ejecución del siguiente middleware o ruta
        next();
    });
};

// Ruta para registrar un nuevo usuario
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    
    // Validar que los campos username y password están presentes
    if (!username || !password) return res.status(400).json({ message: "Faltan datos" });

    // Encriptar la contraseña del usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Guardar el usuario en la base de datos
    const result = await pool.query("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username", [username, hashedPassword]);
    
    // Retornar el usuario registrado con el id y el username
    res.status(201).json(result.rows[0]);
});

// Ruta para iniciar sesión de un usuario
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    
    // Buscar el usuario en la base de datos por el nombre de usuario
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    
    // Si no se encuentra el usuario, retornar un error 401 (usuario no encontrado)
    if (result.rows.length === 0) return res.status(401).json({ message: "Usuario no encontrado" });

    const user = result.rows[0];
    
    // Verificar que la contraseña proporcionada coincida con la contraseña encriptada de la base de datos
    const validPassword = await bcrypt.compare(password, user.password);
    
    // Si la contraseña es incorrecta, retornar un error 401
    if (!validPassword) return res.status(401).json({ message: "Contraseña incorrecta" });

    // Crear un token JWT que contiene el id y el username del usuario
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });

    // Guardar el token en una cookie con la opción httpOnly (para mayor seguridad)
    res.cookie("token", token, { httpOnly: true, secure: false }); // En producción usa `secure: true`
    
    // Retornar un mensaje de éxito con el username del usuario
    res.json({ message: "Autenticación exitosa", username: user.username });
});

// Ruta protegida para obtener el perfil del usuario autenticado
app.get("/profile", authenticateToken, (req, res) => {
    // Si el token es válido, se accederá a esta ruta y se podrá enviar la información del usuario
    res.json({ message: "Acceso permitido", user: req.user });
});

// Ruta para cerrar la sesión del usuario (eliminar el token de la cookie)
app.post("/logout", (req, res) => {
    // Limpiar la cookie que contiene el token
    res.clearCookie("token");
    
    // Retornar un mensaje indicando que la sesión ha sido cerrada
    res.json({ message: "Sesión cerrada" });
});

// Definir el puerto del servidor, usando el valor de la variable de entorno o el puerto 5000 por defecto
const PORT = process.env.PORT || 5000;

// Iniciar el servidor en el puerto especificado
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
