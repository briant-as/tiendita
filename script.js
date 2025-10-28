// Archivo: script.js (VERSIÓN FINAL COMPLETA Y CONSOLIDADA - Actualizado para Render y Cloudinary)

// URL base de tu API desplegada
const API_URL = 'https://tiendita-zulr.onrender.com';

// --- FUNCIÓN PARA PEDIR TODOS LOS PRODUCTOS A LA API ---
async function obtenerTodosLosProductos() {
    try {
        const respuesta = await fetch(`${API_URL}/api/productos`);
        if (!respuesta.ok) throw new Error('Error al conectar con el servidor');
        return await respuesta.json();
    } catch (error) {
        console.error("Error obteniendo productos:", error);
        return [];
    }
}

// --- FUNCIONES DEL CARRITO ---
function agregarAlCarrito(productoId) {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    carrito.push(productoId);
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    const contadorElement = document.getElementById('contador-carrito');
    if (contadorElement) {
        const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
        contadorElement.textContent = carrito.length;
    }
}

async function renderizarCarrito() {
    const productos = await obtenerTodosLosProductos(); // Obtenemos todos para comparar
    const listaCarritoElement = document.getElementById('lista-carrito');
    const totalPrecioElement = document.getElementById('total-precio');
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    if (!listaCarritoElement || !totalPrecioElement) return; // Asegurarse de que los elementos existan

    listaCarritoElement.innerHTML = '';
    let total = 0;

    if (carrito.length === 0) {
        listaCarritoElement.innerHTML = '<p>Tu carrito está vacío.</p>';
        totalPrecioElement.textContent = '$0.00';
    } else {
        const productosAgrupados = {};
        carrito.forEach(id => { productosAgrupados[id] = (productosAgrupados[id] || 0) + 1; });

        for (const id in productosAgrupados) {
            const producto = productos.find(p => p.id === id); // Comparación de strings funciona bien aquí
            const cantidad = productosAgrupados[id];
            if (producto) {
                const itemPrecio = parseFloat(producto.precio) * cantidad;
                total += itemPrecio;
                // La URL de imagen ahora viene directamente de Cloudinary via backend
                const imagenSrc = producto.imagen; // Usar directamente
                const itemHTML = `
                <div class="item-carrito">
                    <img src="${imagenSrc}" alt="${producto.nombre}">
                    <div class="item-info">
                        <h4>${producto.nombre}</h4>
                        <p>Precio: $${producto.precio}</p>
                    </div>
                    <p>Cantidad: ${cantidad}</p>
                </div>
            `;
                listaCarritoElement.innerHTML += itemHTML;
            } else {
                console.warn(`Producto con ID ${id} no encontrado en la lista principal.`);
            }
        }
        totalPrecioElement.textContent = `$${total.toFixed(2)}`;
    }

    // Configuramos el botón de vaciar
    const btnVaciar = document.getElementById('btn-vaciar-carrito');
    if (btnVaciar) {
        btnVaciar.onclick = () => { // Usar onclick para evitar duplicados si se llama varias veces
            vaciarCarrito(productos);
        };
    }
}

function vaciarCarrito(productos) {
    localStorage.removeItem('carrito');
    actualizarContadorCarrito();
    renderizarCarrito(productos); // Pasamos los productos para que pueda redibujar
}

// --- LÓGICA DE LA PÁGINA DE INICIO ---
async function renderizarProductosInicio() {
    const productos = await obtenerTodosLosProductos();
    // Mostramos en ambas grillas usando la función auxiliar
    mostrarProductosEnGrilla(productos, '.caja-de-productos'); // Para "Encuentra tu estilo"
    mostrarProductosEnGrilla(productos, '.caja');              // Para "Ofertas"
}

// --- LÓGICA DE LA PÁGINA DE PRODUCTO ---
async function configurarPaginaProducto() {
    const productos = await obtenerTodosLosProductos();
    const params = new URLSearchParams(window.location.search);
    const productoId = params.get('id');
    const producto = productos.find(p => p.id === productoId); // Comparación de strings

    const imgElement = document.getElementById('producto-img');
    const nombreElement = document.getElementById('producto-nombre');
    const descripcionElement = document.getElementById('producto-descripcion');
    const precioElement = document.getElementById('producto-precio');
    const btnAgregar = document.getElementById('btn-agregar');

    if (producto && imgElement && nombreElement && descripcionElement && precioElement && btnAgregar) {
        imgElement.src = producto.imagen; // URL directa de Cloudinary
        imgElement.alt = producto.nombre;
        nombreElement.textContent = producto.nombre;
        descripcionElement.textContent = producto.descripcion;
        precioElement.textContent = `$${producto.precio}`;
        btnAgregar.onclick = () => { // Usar onclick
            agregarAlCarrito(producto.id);
            btnAgregar.textContent = '¡Añadido!';
            setTimeout(() => { btnAgregar.textContent = 'Añadir al carrito'; }, 2000);
        };
    } else {
        const detalleElement = document.querySelector('.producto-detalle');
        if (detalleElement) detalleElement.innerHTML = '<h2>Producto no encontrado</h2>';
        // Deshabilitar botón si no hay producto
        if (btnAgregar) btnAgregar.disabled = true;
    }
}

// --- LÓGICA DE LA PÁGINA DE CATEGORÍA ---
async function renderizarPaginaCategoria() {
    const contenedor = document.getElementById('grilla-categoria');
    const tituloElement = document.getElementById('titulo-categoria');
    if (!contenedor || !tituloElement) return;

    const params = new URLSearchParams(window.location.search);
    const categoria = params.get('cat');

    if (!categoria) {
        tituloElement.textContent = "Categoría no especificada"; return;
    }

    const titulo = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    tituloElement.textContent = `Sección: ${titulo}`;

    try {
        const respuesta = await fetch(`${API_URL}/api/productos/categoria/${categoria}`);
        if (!respuesta.ok) throw new Error('No se pudo cargar la categoría.');
        const productos = await respuesta.json();
        mostrarProductosEnGrilla(productos, '#grilla-categoria'); // Reutilizamos la función
    } catch (error) {
        console.error("Error cargando categoría:", error);
        tituloElement.textContent = "Error al cargar productos";
        if (contenedor) contenedor.innerHTML = '<p>No se pudieron cargar los productos.</p>';
    }
}

// --- LÓGICA DEL FORMULARIO DE CONTACTO ---
function configurarFormularioContacto() {
    const formulario = document.getElementById('formulario-contacto');
    if (!formulario) return;

    const nombreInput = document.getElementById('nombre');
    const emailInput = document.getElementById('email');
    const mensajeInput = document.getElementById('mensaje');
    const errorContainer = document.getElementById('mensaje-error');

    formulario.addEventListener('submit', (event) => {
        event.preventDefault();
        errorContainer.textContent = '';
        let errores = [];

        if (nombreInput.value.trim() === '') errores.push('El campo Nombre es obligatorio.');
        if (emailInput.value.trim() === '') errores.push('El campo Correo Electrónico es obligatorio.');
        if (mensajeInput.value.trim() === '') errores.push('El campo Mensaje es obligatorio.');

        if (errores.length > 0) {
            errorContainer.textContent = errores.join(' ');
        } else {
            alert('¡Mensaje enviado con éxito! Gracias por contactarnos.');
            formulario.reset();
        }
    });
}

// --- LÓGICA DE LA BARRA DE BÚSQUEDA ---
function configurarBarraBusqueda() {
    const formBusqueda = document.getElementById('form-busqueda');
    const inputBusqueda = document.getElementById('input-busqueda');
    if (!formBusqueda || !inputBusqueda) return;

    inputBusqueda.addEventListener('input', async (event) => {
        const termino = event.target.value.trim();
        const contenedorResultados = document.querySelector('.caja-de-productos'); // Donde mostrar resultados
        const contenedorOfertas = document.querySelector('.productos-destacados'); // Para ocultar/mostrar
        const tituloPrincipal = document.querySelector('.caja-grande h3'); // Para cambiar título

        if (termino.length > 1) {
            try {
                const respuesta = await fetch(`${API_URL}/api/productos/buscar?q=${termino}`);
                const productos = await respuesta.json();
                mostrarProductosEnGrilla(productos, '.caja-de-productos'); // Mostrar resultados
                if (contenedorOfertas) contenedorOfertas.style.display = 'none'; // Ocultar ofertas
                if (tituloPrincipal) tituloPrincipal.textContent = 'Resultados de la Búsqueda';
            } catch (error) { console.error("Error al buscar:", error); }
        } else if (termino.length === 0) {
            // Si borra todo, volvemos a mostrar todos los productos iniciales
            renderizarProductosInicio();
            if (contenedorOfertas) contenedorOfertas.style.display = 'block'; // Mostrar ofertas
            if (tituloPrincipal) tituloPrincipal.textContent = 'ENCUENTRA TU ESTILO';
        }
    });

    formBusqueda.addEventListener('submit', (event) => event.preventDefault());
}

// --- FUNCIÓN AUXILIAR PARA DIBUJAR PRODUCTOS EN UNA GRILLA ---
function mostrarProductosEnGrilla(productos, selectorContenedor) {
    const contenedor = document.querySelector(selectorContenedor);
    if (!contenedor) {
        console.warn(`Contenedor no encontrado: ${selectorContenedor}`);
        return;
    }
    contenedor.innerHTML = ''; // Limpiamos siempre
    if (!productos || productos.length === 0) {
        contenedor.innerHTML = '<p>No se encontraron productos.</p>'; return;
    }
    productos.forEach(producto => {
        const imagenSrc = producto.imagen; // URL directa de Cloudinary
        const productoHTML = `
            <a href="producto.html?id=${producto.id}" class="cart">
                <img src="${imagenSrc}" alt="${producto.nombre || 'Producto'}">
                <p>${producto.nombre || 'Sin nombre'}</p>
                <p class="price">$${producto.precio || '0.00'}</p>
            </a>
        `;
        contenedor.innerHTML += productoHTML;
    });
}


// --- INICIALIZACIÓN GENERAL ---
document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorCarrito(); // Siempre actualiza el ícono
    configurarBarraBusqueda();   // Siempre configura la búsqueda (si existe en la página)

    // Llama a la función específica según la página actual
    if (document.querySelector('.caja-de-productos')) renderizarProductosInicio();
    if (document.getElementById('btn-agregar')) configurarPaginaProducto();
    if (document.getElementById('lista-carrito')) renderizarCarrito();
    if (document.getElementById('grilla-categoria')) renderizarPaginaCategoria();
    if (document.getElementById('formulario-contacto')) configurarFormularioContacto();
});