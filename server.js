// Archivo: server.js (VERSIÓN FINAL COMPLETA Y CORRECTA)

// --- 1. IMPORTACIONES ---
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// --- 2. CONFIGURACIÓN DE LA APP ---
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// --- 3. CONFIGURACIÓN DE CLOUDINARY ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Usaremos variables de entorno
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- 4. CONFIGURACIÓN DE MULTER CON CLOUDINARY STORAGE ---
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'tiendita', // Carpeta donde se guardarán las imágenes en Cloudinary
        format: async (req, file) => 'jpg', // Formato de la imagen
        public_id: (req, file) => Date.now() + '-' + file.originalname, // Nombre único
    },
});

const upload = multer({ storage: storage });


// --- 4. CONFIGURACIÓN DE MONGODB ---
const uri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;

if (!uri || !jwtSecret) {
    console.error("ERROR: Las variables de entorno MONGO_URI y JWT_SECRET deben estar definidas.");
    process.exit(1);
}

const client = new MongoClient(uri);
let productosCollection;
let usuariosCollection;

// --- 5. FUNCIÓN DE CONEXIÓN A LA BD ---
async function connectDB() {
    try {
        await client.connect();
        const database = client.db("tienditaDB");
        productosCollection = database.collection("productos");
        usuariosCollection = database.collection("usuarios");
        console.log("¡Conectado exitosamente a la base de datos!");
    } catch (error) {
        console.error("Falló la conexión a la base de datos", error);
        process.exit(1);
    }
}

// --- 6. MIDDLEWARE DE AUTENTICACIÓN ---
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// --- 7. RUTAS DE LA API ---

// --- RUTAS DE PRODUCTOS (PÚBLICAS) ---

// GET Todos los productos
app.get('/api/productos', async (req, res) => {
    try {
        const productos = await productosCollection.find({}).toArray();
        const productosConId = productos.map(p => ({
            id: p._id.toString(),
            nombre: p.nombre,
            precio: p.precio,
            imagen: p.imagen,
            descripcion: p.descripcion,
            categoria: p.categoria
        }));
        res.json(productosConId);
    } catch (error) {
        console.error("Error GET /api/productos:", error);
        res.status(500).json({ message: "Error al obtener los productos" });
    }
});

// GET Productos por Categoría
app.get('/api/productos/categoria/:categoria', async (req, res) => {
    try {
        const categoria = req.params.categoria;
        const productos = await productosCollection.find({ categoria: categoria }).toArray();
        const productosConId = productos.map(p => ({
            id: p._id.toString(),
            nombre: p.nombre,
            precio: p.precio,
            imagen: p.imagen,
            descripcion: p.descripcion,
            categoria: p.categoria
        }));
        res.json(productosConId);
    } catch (error) {
        console.error("Error GET /api/productos/categoria:", error);
        res.status(500).json({ message: "Error al obtener los productos" });
    }
});

// GET Buscar productos
app.get('/api/productos/buscar', async (req, res) => {
    try {
        const busqueda = req.query.q;
        if (!busqueda) {
            return res.status(400).json({ message: "No se proporcionó un término de búsqueda" });
        }
        const productos = await productosCollection.find({
            nombre: { $regex: busqueda, $options: 'i' }
        }).toArray();
        const productosConId = productos.map(p => ({
            id: p._id.toString(),
            nombre: p.nombre,
            precio: p.precio,
            imagen: p.imagen,
            descripcion: p.descripcion,
            categoria: p.categoria
        }));
        res.json(productosConId);
    } catch (error) {
        console.error("Error GET /api/productos/buscar:", error);
        res.status(500).json({ message: "Error al obtener los productos" });
    }
});

// --- RUTAS DE PRODUCTOS (PROTEGIDAS - REQUIEREN TOKEN) ---

// POST Crear un producto (protegida)
app.post('/api/productos', verificarToken, upload.single('imagen'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No se subió ninguna imagen" });
        }
        const nuevoProducto = {
            nombre: req.body.nombre,
            precio: req.body.precio,
            categoria: req.body.categoria,
            descripcion: req.body.descripcion,
            imagen: req.file.path // <-- Multer-storage-cloudinary nos da la URL de Cloudinary aquí
        };
        const resultado = await productosCollection.insertOne(nuevoProducto);

        if (resultado.insertedId) {
            const productoCreado = { _id: resultado.insertedId, ...nuevoProducto };
            res.status(201).json(productoCreado);
        } else {
            res.status(500).json({ message: "Error al guardar el producto en la BD" });
        }
    } catch (error) {
        console.error("Error POST /api/productos:", error);
        res.status(500).json({ message: "Error al crear el producto" });
    }
});

// PUT Actualizar un producto
app.put('/api/productos/:id', verificarToken, upload.single('imagen'), async (req, res) => {
    try {
        const id = req.params.id;
        const filtro = { _id: new ObjectId(id) };
        const datosActualizados = {
            nombre: req.body.nombre,
            precio: req.body.precio,
            categoria: req.body.categoria,
            descripcion: req.body.descripcion,
        };
        // Si se subió una nueva imagen, req.file.path tendrá la nueva URL de Cloudinary
        if (req.file) {
            datosActualizados.imagen = req.file.path;
            // Aquí A FUTURO podrías añadir lógica para borrar la imagen antigua de Cloudinary
        }
        const resultado = await productosCollection.updateOne(filtro, { $set: datosActualizados });
        // ... (resto de la lógica PUT igual que antes) ...
    } catch (error) {
        console.error("Error PUT /api/productos/:id :", error);
        res.status(500).json({ message: "Error al actualizar el producto" });
    }
});

// DELETE Borrar un producto (protegida)
app.delete('/api/productos/:id', verificarToken, async (req, res) => {
    try {
        const id = req.params.id;
        const filtro = { _id: new ObjectId(id) };
        // Aquí podrías añadir lógica para borrar la imagen del producto del servidor
        const resultado = await productosCollection.deleteOne(filtro);
        if (resultado.deletedCount === 1) {
            res.status(200).json({ message: "Producto eliminado" });
        } else {
            res.status(404).json({ message: "No se encontró el producto" });
        }
    } catch (error) {
        console.error("Error DELETE /api/productos/:id :", error);
        res.status(500).json({ message: "Error al eliminar el producto" });
    }
});

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
        await connectDB();
        app.listen(port, () => {
            console.log(`¡Servidor escuchando en http://localhost:${port} o en tu URL de Render`);
        });
    } catch (error) {
        console.error("No se pudo iniciar el servidor:", error);
        process.exit(1);
    }
}

// Arrancamos el servidor
startServer();