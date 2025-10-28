// Archivo: script.js (VERSIÓN COMPLETA Y CONSOLIDADA)

// --- FUNCIÓN PARA PEDIR TODOS LOS PRODUCTOS A LA API ---
async function obtenerTodosLosProductos() {
    try {
        const respuesta = await fetch('http://localhost:3000/api/productos');
        if (!respuesta.ok) throw new Error('Error al conectar con el servidor');
        return await respuesta.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}
// En script.js

// --- FUNCIÓN AUXILIAR PARA DIBUJAR PRODUCTOS EN LA GRILLA ---
function mostrarProductosEnGrilla(productos, selectorContenedor) {
    const contenedor = document.querySelector(selectorContenedor);
    if (!contenedor) return;

    contenedor.innerHTML = ''; // Limpiamos la grilla

    if (productos.length === 0) {
        contenedor.innerHTML = '<p>No se encontraron productos que coincidan con tu búsqueda.</p>';
        return;
    }

    productos.forEach(producto => {
        const productoHTML = `
            <a href="producto.html?id=${producto.id}" class="cart">
                <img src="${producto.imagen}" alt="${producto.nombre}">
                <p>${producto.nombre}</p>
                <p class="price">$${producto.precio}</p>
            </a>
        `;
        contenedor.innerHTML += productoHTML;
    });
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

    listaCarritoElement.innerHTML = '';
    let total = 0;

    if (carrito.length === 0) {
        listaCarritoElement.innerHTML = '<p>Tu carrito está vacío.</p>';
        if (totalPrecioElement) totalPrecioElement.textContent = '$0.00';
    } else {
        const productosAgrupados = {};
        carrito.forEach(id => { productosAgrupados[id] = (productosAgrupados[id] || 0) + 1; });

        for (const id in productosAgrupados) {
            const producto = productos.find(p => p.id === id);
            const cantidad = productosAgrupados[id];
            if (producto) {
                const itemPrecio = parseFloat(producto.precio) * cantidad;
                total += itemPrecio;
                const itemHTML = `
                <div class="item-carrito">
                    <img src="${producto.imagen}" alt="${producto.nombre}">
                    <div class="item-info">
                        <h4>${producto.nombre}</h4>
                        <p>Precio: $${producto.precio}</p>
                    </div>
                    <p>Cantidad: ${cantidad}</p>
                </div>
            `;
                listaCarritoElement.innerHTML += itemHTML;
            }
        }
        if (totalPrecioElement) totalPrecioElement.textContent = `$${total.toFixed(2)}`;
    }

    // Configuramos el botón de vaciar (debe estar DENTRO de esta función)
    const btnVaciar = document.getElementById('btn-vaciar-carrito');
    if (btnVaciar) {
        btnVaciar.addEventListener('click', () => {
            vaciarCarrito(productos); // Le pasamos los productos
        });
    }
}

function vaciarCarrito(productos) {
    localStorage.removeItem('carrito');
    actualizarContadorCarrito();
    // Vuelve a renderizar el carrito (que ahora estará vacío)
    renderizarCarrito(productos);
}
// En script.js

// --- LÓGICA DE LA BARRA DE BÚSQUEDA ---
function configurarBarraBusqueda() {
    const formBusqueda = document.getElementById('form-busqueda');
    const inputBusqueda = document.getElementById('input-busqueda');

    if (!formBusqueda || !inputBusqueda) return; // Si no estamos en una página con búsqueda, salimos

    // Evento para cuando el usuario escribe (live search)
    inputBusqueda.addEventListener('input', async (event) => {
        const termino = event.target.value.trim();

        if (termino.length > 1) {
            // Si escribe más de 1 letra, busca en la API
            try {
                const respuesta = await fetch(`http://localhost:3000/api/productos/buscar?q=${termino}`);
                const productos = await respuesta.json();
                // Mostramos los resultados en la grilla principal
                mostrarProductosEnGrilla(productos, '.caja-de-productos');
                // Ocultamos la grilla de ofertas
                document.querySelector('.productos-destacados').style.display = 'none';
                document.querySelector('.caja-grande h3').textContent = 'Resultados de la Búsqueda';
            } catch (error) {
                console.error("Error al buscar:", error);
            }
        } else if (termino.length === 0) {
            // Si borra todo, volvemos a mostrar todos los productos
            renderizarProductosInicio();
            document.querySelector('.productos-destacados').style.display = 'block';
            document.querySelector('.caja-grande h3').textContent = 'ENCUENTRA TU ESTILO';
        }
    });

    // Prevenimos que el formulario se envíe de la forma tradicional
    formBusqueda.addEventListener('submit', (event) => {
        event.preventDefault();
    });
}

// --- LÓGICA DE LA PÁGINA DE INICIO ---
// En script.js

// --- LÓGICA DE LA PÁGINA DE INICIO (ACTUALIZADA) ---
async function renderizarProductosInicio() {
    const productos = await obtenerTodosLosProductos();
    // Usamos la nueva función para mostrar en ambas grillas
    mostrarProductosEnGrilla(productos, '.caja-de-productos');
    mostrarProductosEnGrilla(productos, '.caja');
}

// --- LÓGICA DE LA PÁGINA DE PRODUCTO ---
async function configurarPaginaProducto() {
    const productos = await obtenerTodosLosProductos(); // Obtenemos todos para encontrar el nuestro
    const params = new URLSearchParams(window.location.search);
    const productoId = params.get('id');
    const producto = productos.find(p => p.id === productoId);

    if (producto) {
        document.getElementById('producto-img').src = producto.imagen;
        document.getElementById('producto-nombre').textContent = producto.nombre;
        document.getElementById('producto-descripcion').textContent = producto.descripcion;
        document.getElementById('producto-precio').textContent = `$${producto.precio}`;
        const btnAgregar = document.getElementById('btn-agregar');
        btnAgregar.addEventListener('click', () => {
            agregarAlCarrito(producto.id);
            btnAgregar.textContent = '¡Añadido!';
            setTimeout(() => { btnAgregar.textContent = 'Añadir al carrito'; }, 2000);
        });
    } else {
        document.querySelector('.producto-detalle').innerHTML = '<h2>Producto no encontrado</h2>';
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
        tituloElement.textContent = "Categoría no encontrada";
        return;
    }

    const titulo = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    tituloElement.textContent = `Sección: ${titulo}`;

    try {
        const respuesta = await fetch(`http://localhost:3000/api/productos/categoria/${categoria}`);
        if (!respuesta.ok) throw new Error('No se pudo cargar la categoría.');

        const productos = await respuesta.json();

        contenedor.innerHTML = '';
        if (productos.length === 0) {
            contenedor.innerHTML = '<p>No hay productos en esta categoría por el momento.</p>';
            return;
        }

        productos.forEach(producto => {
            const productoHTML = `
                <a href="producto.html?id=${producto.id}" class="cart">
                    <img src="${producto.imagen}" alt="${producto.nombre}">
                    <p>${producto.nombre}</p>
                    <p class="price">$${producto.precio}</p>
                </a>
            `;
            contenedor.innerHTML += productoHTML;
        });

    } catch (error) {
        console.error(error);
        tituloElement.textContent = "Error al cargar productos";
    }
}

// --- LÓGICA DEL FORMULARIO DE CONTACTO ---
function configurarFormularioContacto() {
    const formulario = document.getElementById('formulario-contacto');
    if (!formulario) return; // Si no estamos en la pág. de contacto, salimos

    const nombreInput = document.getElementById('nombre');
    const emailInput = document.getElementById('email');
    const mensajeInput = document.getElementById('mensaje');
    const errorContainer = document.getElementById('mensaje-error');

    formulario.addEventListener('submit', (event) => {
        event.preventDefault();
        errorContainer.textContent = '';
        let errores = [];

        if (nombreInput.value.trim() === '') {
            errores.push('El campo Nombre es obligatorio.');
        }
        if (emailInput.value.trim() === '') {
            errores.push('El campo Correo Electrónico es obligatorio.');
        }
        if (mensajeInput.value.trim() === '') {
            errores.push('El campo Mensaje es obligatorio.');
        }

        if (errores.length > 0) {
            errorContainer.textContent = errores.join(' ');
        } else {
            alert('¡Mensaje enviado con éxito! Gracias por contactarnos.');
            formulario.reset();
        }
    });
}


// --- FUNCIÓN PRINCIPAL QUE GESTIONA TODO ---
document.addEventListener('DOMContentLoaded', () => {
    // Esta función se ejecuta en TODAS las páginas
    actualizarContadorCarrito();
    configurarBarraBusqueda();

    // Verificamos en qué página estamos y llamamos a la función correcta
    if (document.querySelector('.caja-de-productos')) {
        renderizarProductosInicio();
    }
    if (document.getElementById('btn-agregar')) {
        configurarPaginaProducto();
    }

    // Verificamos en qué página estamos y llamamos a la función correcta
    if (document.querySelector('.caja-de-productos')) {
        renderizarProductosInicio();
    }
    if (document.getElementById('btn-agregar')) {
        configurarPaginaProducto();
    }
    if (document.getElementById('lista-carrito')) {
        renderizarCarrito();
    }
    if (document.getElementById('grilla-categoria')) {
        renderizarPaginaCategoria();
    }
    if (document.getElementById('formulario-contacto')) {
        configurarFormularioContacto();
    }
});