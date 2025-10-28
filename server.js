// Archivo: server.js (VERSIÓN FINAL COMPLETA PARA DESPLIEGUE)

// --- 1. IMPORTACIONES ---
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// --- 2. CONFIGURACIÓN DE LA APP ---
const app = express();
// Puerto dinámico para Render o 3000 para local
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json()); // Para entender JSON
// Hacemos la carpeta 'uploads' pública para que el frontend pueda ver las imágenes
// Esto es crucial para que Render pueda servir las imágenes subidas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 3. CONFIGURACIÓN DE MULTER (SUBIDA DE ARCHIVOS) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Los archivos se guardarán en la carpeta "uploads"
    },
    filename: function (req, file, cb) {
        // Nombre único para el archivo
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- 4. CONFIGURACIÓN DE MONGODB ---
// Leemos la URI y el secreto JWT desde las Variables de Entorno (configuradas en Render)
const uri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;

// Verificamos que las variables de entorno estén configuradas
if (!uri || !jwtSecret) {
    console.error("ERROR: Las variables de entorno MONGO_URI y JWT_SECRET deben estar definidas.");
    process.exit(1);
}

const client = new MongoClient(uri);

// Variables globales para las colecciones
let productosCollection;
let usuariosCollection;

// --- 5. FUNCIÓN DE CONEXIÓN A LA BD ---
async function connectDB() {
    try {
        await client.connect();
        const database = client.db("tienditaDB"); // Puedes cambiar "tienditaDB" si quieres
        productosCollection = database.collection("productos");
        usuariosCollection = database.collection("usuarios");

        console.log("¡Conectado exitosamente a la base de datos!");
    } catch (error) {
        console.error("Falló la conexión a la base de datos", error);
        process.exit(1); // Detenemos la app si no nos podemos conectar
    }
}

// --- 6. MIDDLEWARE DE AUTENTICACIÓN ---
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // No hay token

    jwt.verify(token, jwtSecret, (err, user) => { // Usamos el secreto de las variables de entorno
        if (err) return res.sendStatus(403); // Token inválido o expirado
        req.user = user; // Guardamos la info del usuario decodificada
        next(); // Continuamos a la ruta protegida
    });
}

// --- 7. RUTAS DE LA API ---

// --- RUTAS DE PRODUCTOS (PÚBLICAS) ---
app.get('/api/productos', async (req, res) => { /* ... (código igual que antes) ... */ });
app.get('/api/productos/categoria/:categoria', async (req, res) => { /* ... (código igual que antes) ... */ });
app.get('/api/productos/buscar', async (req, res) => { /* ... (código igual que antes) ... */ });

// --- RUTAS DE PRODUCTOS (PROTEGIDAS - REQUIEREN TOKEN) ---
app.post('/api/productos', verificarToken, upload.single('imagen'), async (req, res) => { /* ... (código igual que antes) ... */ });
app.put('/api/productos/:id', verificarToken, upload.single('imagen'), async (req, res) => { /* ... (código igual que antes) ... */ });
app.delete('/api/productos/:id', verificarToken, async (req, res) => { /* ... (código igual que antes) ... */ });

// --- RUTA DE AUTENTICACIÓN (PÚBLICA) ---
app.post('/api/login', async (req, res) => {
    try {
        const usuario = await usuariosCollection.findOne({ email: req.body.email });
        if (!usuario) {
            return res.status(400).json({ message: "Email o contraseña incorrectos" });
        }
        const esPasswordCorrecta = await bcrypt.compare(req.body.password, usuario.password);
        if (!esPasswordCorrecta) {
            return res.status(400).json({ message: "Email o contraseña incorrectos" });
        }
        const payload = { id: usuario._id, esAdmin: usuario.esAdmin };
        // Usamos el secreto JWT de las variables de entorno
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
        res.status(200).json({ message: "Login exitoso", token: token });
    } catch (error) {
        console.error("Error en el login:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});


// --- 8. INICIO DEL SERVIDOR ---
async function startServer() {
    try {
        await connectDB(); // Conectamos a la BD primero
        app.listen(port, () => { // Luego iniciamos el servidor
            console.log(`¡Servidor escuchando en http://localhost:${port}`);
        });
    } catch (error) {
        console.error("No se pudo iniciar el servidor:", error);
        process.exit(1);
    }
}

// Arrancamos el servidor
startServer();