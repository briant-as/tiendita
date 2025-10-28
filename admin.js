// Archivo: admin.js (VERSIÓN COMPLETA CON AUTENTICACIÓN - Actualizado para Render)

// --- 1. VERIFICACIÓN DE ACCESO ---
const token = localStorage.getItem('admin-token');
if (!token) {
    window.location.href = 'login.html';
} else {
    console.log("Token encontrado, permitiendo acceso al panel.");
}

// --- FUNCIÓN PRINCIPAL QUE SE EJECUTA AL CARGAR LA PÁGINA ADMIN ---
document.addEventListener('DOMContentLoaded', () => {

    let editandoId = null;

    // --- LÓGICA PARA AÑADIR O EDITAR PRODUCTOS ---
    const form = document.getElementById('form-nuevo-producto');
    const mensajeRespuesta = document.getElementById('mensaje-respuesta');
    const formTitulo = document.querySelector('.panel-admin h2');
    const formBoton = document.getElementById('btn-agregar-producto');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const esModoEdicion = !!editandoId;

        const formData = new FormData();
        formData.append('nombre', document.getElementById('nombre').value);
        formData.append('precio', document.getElementById('precio').value);
        formData.append('categoria', document.getElementById('categoria').value);
        formData.append('descripcion', document.getElementById('descripcion').value);

        const imagenInput = document.getElementById('imagen');
        if (imagenInput.files[0]) {
            formData.append('imagen', imagenInput.files[0]);
        }

        try {
            // ACTUALIZADO: URL del backend desplegado
            const url = esModoEdicion
                ? `https://tiendita-zulr.onrender.com/api/productos/${editandoId}`
                : 'https://tiendita-zulr.onrender.com/api/productos';

            const method = esModoEdicion ? 'PUT' : 'POST';

            const respuesta = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                mensajeRespuesta.textContent = esModoEdicion
                    ? '¡Producto actualizado con éxito!'
                    : `¡Producto añadido con éxito!`;
                mensajeRespuesta.style.color = 'green';
                form.reset();
                cargarProductosAdmin();
                formTitulo.textContent = 'Añadir Nuevo Producto';
                formBoton.textContent = 'Añadir Producto';
                editandoId = null;
            } else {
                if (respuesta.status === 401 || respuesta.status === 403) {
                    mensajeRespuesta.textContent = 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.';
                    setTimeout(() => window.location.href = 'login.html', 3000);
                } else {
                    mensajeRespuesta.textContent = `Error: ${resultado.message || 'No se pudo completar la operación'}`;
                }
                mensajeRespuesta.style.color = 'red';
            }
        } catch (error) {
            mensajeRespuesta.textContent = 'Error de conexión con el servidor.';
            mensajeRespuesta.style.color = 'red';
            console.error("Error en submit:", error);
        }
    });

    // --- LÓGICA PARA CARGAR LA LISTA DE PRODUCTOS AL INICIO ---
    cargarProductosAdmin();
});


// --- FUNCIÓN PARA CARGAR Y MOSTRAR LA LISTA DE PRODUCTOS ---
async function cargarProductosAdmin() {
    const listaContenedor = document.getElementById('lista-productos-admin');
    if (!listaContenedor) return;

    try {
        // ACTUALIZADO: URL del backend desplegado
        const respuesta = await fetch('https://tiendita-zulr.onrender.com/api/productos');
        if (!respuesta.ok) throw new Error('No se pudieron cargar los productos');

        const productos = await respuesta.json();

        listaContenedor.innerHTML = '';

        if (productos.length === 0) {
            listaContenedor.innerHTML = '<p>No hay productos en la base de datos.</p>';
            return;
        }

        productos.forEach(producto => {
            // ACTUALIZADO: URL de la imagen del backend desplegado
            const imagenSrc = producto.imagen;
            const productoHTML = `
                <div class="item-admin" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding: 10px 0;">
                    <img src="${imagenSrc}" alt="${producto.nombre || 'Producto sin nombre'}" width="50" height="50" style="object-fit: cover; border: 1px solid #eee;">
                    <span style="flex-grow: 1; margin-left: 15px;">${producto.nombre || 'Sin Nombre'}</span>
                    <button class="btn-editar" data-id="${producto.id}" style="background-color: #007bff; color: white; border: none; padding: 5px 10px; cursor: pointer; margin-right: 5px;">Editar</button>
                    <button class="btn-borrar" data-id="${producto.id}" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer;">Borrar</button>
                </div>
            `;
            listaContenedor.innerHTML += productoHTML;
        });

        asignarEventosBorrar();
        asignarEventosEditar(productos);

    } catch (error) {
        listaContenedor.textContent = 'Error al cargar los productos.';
        console.error("Error cargando productos:", error);
    }
}

// --- FUNCIÓN PARA ASIGNAR LOS CLICS DE "BORRAR" ---
function asignarEventosBorrar() {
    const botonesBorrar = document.querySelectorAll('.btn-borrar');
    botonesBorrar.forEach(boton => {
        boton.onclick = async () => {
            const id = boton.dataset.id;

            if (confirm('¿Estás seguro de que quieres borrar este producto?')) {
                try {
                    // ACTUALIZADO: URL del backend desplegado
                    const respuesta = await fetch(`https://tiendita-zulr.onrender.com/api/productos/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (respuesta.ok) {
                        alert('¡Producto borrado!');
                        cargarProductosAdmin();
                    } else {
                        const resultado = await respuesta.json();
                        alert(`Error al borrar: ${resultado.message || 'Error desconocido'}`);
                        if (respuesta.status === 401 || respuesta.status === 403) {
                            window.location.href = 'login.html';
                        }
                    }
                } catch (error) {
                    alert('Error de conexión al intentar borrar.');
                    console.error("Error borrando:", error);
                }
            }
        };
    });
}

// --- FUNCIÓN PARA ASIGNAR LOS CLICS DE "EDITAR" ---
// Variable global para guardar el ID en edición
let editandoId = null;

function asignarEventosEditar(productos) {
    const botonesEditar = document.querySelectorAll('.btn-editar');
    botonesEditar.forEach(boton => {
        boton.onclick = () => { // No necesita ser async si no esperamos nada
            const id = boton.dataset.id;
            const producto = productos.find(p => p.id === id);

            if (!producto) {
                alert('No se encontró el producto para editar.');
                return;
            }

            document.getElementById('nombre').value = producto.nombre || '';
            document.getElementById('precio').value = producto.precio || '';
            document.getElementById('categoria').value = producto.categoria || '';
            document.getElementById('descripcion').value = producto.descripcion || '';
            document.getElementById('imagen').value = ''; // Limpiar campo de imagen

            document.querySelector('.panel-admin h2').textContent = `Editando: ${producto.nombre}`;
            document.getElementById('btn-agregar-producto').textContent = 'Guardar Cambios';

            // Actualizamos la variable global editandoId
            editandoId = id;

            window.scrollTo(0, 0);
        };
    });
}