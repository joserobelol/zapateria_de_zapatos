/**
 * =========================================================
 * TEEN SHOES - script.js (versión estática para GitHub Pages)
 * =========================================================
 * Sin PHP ni MySQL: los productos se guardan en el navegador
 * con localStorage (cada visitante ve sus propios datos).
 */

const STORAGE_KEY = 'teenshoes_productos';

// Datos de ejemplo para la primera vez que se abre la página
const PRODUCTOS_INICIALES = [
    { id: 1, marca: 'Nike',   modelo: 'Air Max 90',    talla: 27, color: 'Blanco', precio: 2499.00, existencia: 15 },
    { id: 2, marca: 'Adidas', modelo: 'Superstar',     talla: 26, color: 'Negro',  precio: 1899.50, existencia: 8  },
    { id: 3, marca: 'Puma',   modelo: 'Suede Classic', talla: 28, color: 'Azul',   precio: 1599.00, existencia: 5  }
];

let productos = [];
let busqueda = '';

// ---------- 1. ALMACENAMIENTO ----------
function cargarProductos() {
    try {
        const guardado = localStorage.getItem(STORAGE_KEY);
        if (guardado) {
            return JSON.parse(guardado);
        }
    } catch (e) {
        console.warn('No se pudo leer localStorage:', e);
    }
    return PRODUCTOS_INICIALES.slice();
}

function guardarProductos() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
    } catch (e) {
        console.warn('No se pudo guardar en localStorage:', e);
    }
}

function siguienteId() {
    return productos.length ? Math.max.apply(null, productos.map(p => p.id)) + 1 : 1;
}

// ---------- 2. UTILIDADES ----------
function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = String(texto);
    return div.innerHTML;
}

function formatoDinero(n) {
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function mostrarToast(mensaje, tipo) {
    const esExito = tipo === 'exito';
    const el = document.createElement('div');
    el.className = 'toast align-items-center border-0 ' + (esExito ? 'text-bg-success' : 'text-bg-danger');
    el.setAttribute('role', 'alert');
    el.innerHTML =
        '<div class="d-flex">' +
            '<div class="toast-body">' +
                '<i class="fas ' + (esExito ? 'fa-check-circle' : 'fa-exclamation-circle') + ' me-2"></i>' +
                escapar(mensaje) +
            '</div>' +
            '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>' +
        '</div>';
    document.getElementById('toastContainer').appendChild(el);

    const toast = new bootstrap.Toast(el, { delay: esExito ? 4000 : 5000 });
    el.addEventListener('hidden.bs.toast', function () { el.remove(); });
    toast.show();
}

// ---------- 3. DIBUJAR TABLA Y ESTADÍSTICAS ----------
function productosFiltrados() {
    const q = busqueda.trim().toLowerCase();
    if (q === '') return productos.slice();

    return productos.filter(function (p) {
        return p.marca.toLowerCase().includes(q) ||
               p.modelo.toLowerCase().includes(q) ||
               p.color.toLowerCase().includes(q) ||
               String(p.talla).includes(q) ||
               String(p.precio).includes(q);
    });
}

function renderizar() {
    // Más nuevos primero (igual que ORDER BY id DESC)
    const lista = productosFiltrados().sort(function (a, b) { return b.id - a.id; });

    // Estadísticas
    let totalStock = 0;
    let valorInventario = 0;
    lista.forEach(function (p) {
        totalStock += p.existencia;
        valorInventario += p.precio * p.existencia;
    });

    document.getElementById('kpiModelos').textContent = lista.length;
    document.getElementById('kpiStock').textContent = totalStock + ' pares';
    document.getElementById('kpiValor').textContent = '$' + formatoDinero(valorInventario);

    // Texto de resultados de búsqueda
    document.getElementById('textoBusqueda').textContent =
        busqueda.trim() !== '' ? '— Resultados para: "' + busqueda.trim() + '"' : '';

    // Filas
    const tbody = document.getElementById('tablaProductos');
    if (lista.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="7" class="text-center py-4 text-muted">' +
            (busqueda.trim() !== '' ? 'No se encontraron resultados para tu búsqueda.' : 'No hay productos registrados aún.') +
            '</td></tr>';
        return;
    }

    tbody.innerHTML = lista.map(function (p) {
        return '<tr>' +
            '<td><strong>' + escapar(p.marca) + '</strong></td>' +
            '<td>' + escapar(p.modelo) + '</td>' +
            '<td>' + escapar(p.talla) + '</td>' +
            '<td>' + escapar(p.color) + '</td>' +
            '<td>$' + formatoDinero(p.precio) + '</td>' +
            '<td><span class="badge-stock ' + (p.existencia < 10 ? 'low' : '') + '">' + p.existencia + ' pzas</span></td>' +
            '<td>' +
                '<button class="btn-action btn-edit" onclick="abrirModalEditar(' + p.id + ')" title="Editar">' +
                    '<i class="fas fa-edit"></i></button>' +
                '<button class="btn-action btn-delete" onclick="eliminarProducto(' + p.id + ')" title="Eliminar">' +
                    '<i class="fas fa-trash-alt"></i></button>' +
            '</td>' +
        '</tr>';
    }).join('');
}

// ---------- 4. CRUD ----------
function agregarProducto(datos) {
    productos.push({
        id: siguienteId(),
        marca: datos.marca,
        modelo: datos.modelo,
        talla: datos.talla,
        color: datos.color,
        precio: datos.precio,
        existencia: datos.existencia
    });
    guardarProductos();
    renderizar();
    mostrarToast('El producto se añadió correctamente', 'exito');
}

function abrirModalEditar(id) {
    const p = productos.find(function (prod) { return prod.id === id; });
    if (!p) {
        mostrarToast('Producto no encontrado', 'error');
        return;
    }

    document.getElementById('edit_id').value         = p.id;
    document.getElementById('edit_marca').value      = p.marca;
    document.getElementById('edit_modelo').value     = p.modelo;
    document.getElementById('edit_talla').value      = p.talla;
    document.getElementById('edit_color').value      = p.color;
    document.getElementById('edit_precio').value     = p.precio;
    document.getElementById('edit_existencia').value = p.existencia;

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditar')).show();
}

function editarProducto(id, datos) {
    const p = productos.find(function (prod) { return prod.id === id; });
    if (!p) {
        mostrarToast('Error al actualizar el producto', 'error');
        return;
    }
    p.marca = datos.marca;
    p.modelo = datos.modelo;
    p.talla = datos.talla;
    p.color = datos.color;
    p.precio = datos.precio;
    p.existencia = datos.existencia;

    guardarProductos();
    renderizar();
    mostrarToast('El producto se editó correctamente', 'exito');
}

function eliminarProducto(id) {
    if (!confirm('¿Seguro que deseas eliminar este zapato?')) return;

    productos = productos.filter(function (p) { return p.id !== id; });
    guardarProductos();
    renderizar();
    mostrarToast('El producto se eliminó correctamente', 'exito');
}

// ---------- 5. LEER Y VALIDAR FORMULARIOS ----------
function leerDatos(marca, modelo, talla, color, precio, existencia) {
    const datos = {
        marca: marca.trim(),
        modelo: modelo.trim(),
        talla: parseInt(talla, 10),
        color: color.trim(),
        precio: parseFloat(precio),
        existencia: parseInt(existencia, 10)
    };

    const valido = datos.marca !== '' && datos.modelo !== '' && datos.talla > 0 &&
                   datos.color !== '' && datos.precio >= 0 && datos.existencia >= 0;
    return valido ? datos : null;
}

// ---------- 6. CUANDO CARGA LA PÁGINA ----------
document.addEventListener('DOMContentLoaded', function () {

    productos = cargarProductos();
    guardarProductos(); // guarda los datos de ejemplo la primera vez
    renderizar();

    // Formulario AGREGAR
    const formAgregar = document.getElementById('formAgregar');
    formAgregar.addEventListener('submit', function (e) {
        e.preventDefault();
        const f = formAgregar.elements;
        const datos = leerDatos(f.marca.value, f.modelo.value, f.talla.value,
                                f.color.value, f.precio.value, f.existencia.value);
        if (!datos) {
            mostrarToast('Por favor, llena todos los campos del formulario.', 'error');
            return;
        }
        agregarProducto(datos);
        bootstrap.Modal.getInstance(document.getElementById('modalAgregar')).hide();
    });

    // Limpiar el formulario de "Agregar" cada vez que se cierra el modal
    document.getElementById('modalAgregar').addEventListener('hidden.bs.modal', function () {
        formAgregar.reset();
    });

    // Formulario EDITAR
    document.getElementById('formEditar').addEventListener('submit', function (e) {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit_id').value, 10);
        const datos = leerDatos(
            document.getElementById('edit_marca').value,
            document.getElementById('edit_modelo').value,
            document.getElementById('edit_talla').value,
            document.getElementById('edit_color').value,
            document.getElementById('edit_precio').value,
            document.getElementById('edit_existencia').value
        );
        if (!datos) {
            mostrarToast('Por favor, llena todos los campos del formulario.', 'error');
            return;
        }
        editarProducto(id, datos);
        bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
    });

    // Buscador: filtra mientras escribes; Escape limpia el texto
    const inputBuscar = document.getElementById('inputBuscar');
    inputBuscar.addEventListener('input', function () {
        busqueda = inputBuscar.value;
        renderizar();
    });
    inputBuscar.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && inputBuscar.value !== '') {
            inputBuscar.value = '';
            busqueda = '';
            renderizar();
        }
    });
});
