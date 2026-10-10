/* ========================================================
   HEADER, MENU MOBILE Y SCROLL REVEAL (De tu código)
======================================================== */
const header = document.getElementById("header");
window.addEventListener("scroll", () => {
    if (window.scrollY > 20) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
}, { passive: true });

const nav = document.getElementById("nav");
const menuButton = document.getElementById("menuButton");
function toggleMenu() {
    nav.classList.toggle("active");
    menuButton.setAttribute("aria-expanded", nav.classList.contains("active"));
}
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        nav.classList.remove("active");
        menuButton.setAttribute("aria-expanded", "false");
    });
});

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: .12 });
    revealElements.forEach(element => observer.observe(element));
}

/* ========================================================
   CONEXIÓN A ORACLE Y RENDERIZADO DE MODALES
======================================================== */
// IMPORTANTE: cambia esta URL cada vez que reinicies el túnel (sin barra al final)
const API_URL = 'https://1a7c7c48c56e7a.lhr.life/distexma';

let inventarioOracle = [];
const NOMBRES_ORACLE = { 'capuano': 'Capuano', 'sedalina': 'Sedalina', 'zim': 'Lana Zim' };

document.addEventListener("DOMContentLoaded", async () => {
    configurarFechaMinima();
    try {
        const response = await fetch(`${API_URL}/api_catalogo.php`);
        inventarioOracle = await response.json();
    } catch (error) {
        console.error("Error al conectar con Oracle:", error);
    }
});

function configurarFechaMinima() {
    const inputFecha = document.getElementById('checkoutDate');
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    inputFecha.min = manana.toISOString().split('T')[0];
}

/* ========================================================
   MODAL DE CATÁLOGO (CÍRCULOS HEX Y TAMAÑOS)
======================================================== */
const productModal = document.getElementById("productModal");
const productModalTitle = document.getElementById("productModalTitle");
const productModalContent = document.getElementById("productModalContent");
let tipoSeleccionadoActual = '';

function openProduct(idHtml) {
    tipoSeleccionadoActual = NOMBRES_ORACLE[idHtml];
    productModalTitle.textContent = "Catálogo: " + tipoSeleccionadoActual;

    const hilos = inventarioOracle.filter(item => item.TIPO_HILO === tipoSeleccionadoActual);
    const coloresUnicos = [];
    const hexVistos = new Set();

    hilos.forEach(item => {
        if(!hexVistos.has(item.CODIGO_HEX)) {
            hexVistos.add(item.CODIGO_HEX);
            coloresUnicos.push(item);
        }
    });

    productModalContent.innerHTML = `
        <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 15px;">Selecciona un color para ver precios y presentaciones.</p>
        <div class="colores-grid">
            ${coloresUnicos.map(c => `
                <div class="color-item" onclick="seleccionarColor('${c.CODIGO_HEX}', '${c.COLOR_NOMBRE}')">
                    <div class="color-circle" style="background-color: ${c.CODIGO_HEX};"></div>
                    <span class="color-name">${c.COLOR_NOMBRE}</span>
                </div>
            `).join('')}
        </div>
        <div id="tamanosContainer" class="tamanos-grid" style="display:none;"></div>
    `;

    productModal.classList.add("active");
    document.body.classList.add("modal-open");
}

let productosTamanoActual = [];
let colorSeleccionadoData = {};

function seleccionarColor(hex, nombreColor) {
    const container = document.getElementById("tamanosContainer");
    const grid = document.querySelector('.colores-grid');

    productosTamanoActual = inventarioOracle.filter(item =>
        (item.tipo_hilo === tipoSeleccionadoActual || item.TIPO_HILO === tipoSeleccionadoActual) &&
        (item.codigo_hex === hex || item.CODIGO_HEX === hex)
    );

    colorSeleccionadoData = { hex, nombreColor };
    if (productosTamanoActual.length === 0) return;

    if (grid) grid.style.display = "none";
    container.style.display = "block";

    container.innerHTML = `
        <button type="button" onclick="volverAColores()" style="background:none; border:none; color:var(--navy); font-size:1rem; font-weight:bold; cursor:pointer; margin-bottom:20px; display:flex; align-items:center; gap:5px; padding:0;">
            ← Volver a todos los colores
        </button>

        <div style="padding-top:10px;">
            <div class="color-preview-container">
                <div class="large-color-circle" style="background-color: ${hex};"></div>
                <div class="color-preview-info">
                    <h3>${nombreColor}</h3>
                    <p>Selecciona la presentación que deseas:</p>
                </div>
            </div>
            <div class="size-selector" id="sizeSelectorPills">
                ${productosTamanoActual.map((p, index) => {
                    const nombreTamano = p.tamano || p.TAMANO;
                    return `<div class="size-pill ${index === 0 ? 'active' : ''}" onclick="cambiarTamano(${index}, this)">${nombreTamano}</div>`;
                }).join('')}
            </div>
            <div id="purchaseActionContainer"></div>
        </div>
    `;

    cambiarTamano(0, document.querySelector('.size-pill.active'));
}

function cambiarTamano(index, elementoPill) {
    const pills = document.querySelectorAll('.size-pill');
    pills.forEach(p => p.classList.remove('active'));
    if(elementoPill) elementoPill.classList.add('active');

    const p = productosTamanoActual[index];
    const containerAction = document.getElementById("purchaseActionContainer");

    const precio = p.precio || p.PRECIO;
    const codigo = p.codigo_interno || p.CODIGO_INTERNO;
    const stock = p.stock || p.STOCK;
    const tipo = p.tipo_hilo || p.TIPO_HILO;
    const tamano = p.tamano || p.TAMANO;

    containerAction.innerHTML = `
        <div class="purchase-action-card">
            <div>
                <div class="purchase-price">Q${precio}</div>
                <div class="purchase-meta">
                    Cód: <strong>${codigo}</strong> <br>
                    Disp: <strong>${stock} conos</strong>
                </div>
            </div>
            <div class="purchase-controls">
                <input type="number" id="qty-add-large" class="purchase-qty" value="1" min="1" max="${stock}">
                <button class="btn-add-large" onclick="agregarDesdeGrande('${codigo}', '${tipo}', '${colorSeleccionadoData.nombreColor}', '${tamano}', ${precio}, ${stock})">
                    + Agregar
                </button>
            </div>
        </div>
        <div id="stock-error-msg" style="color: #dc3545; font-size: 0.85rem; margin-top: 10px; text-align: right; display: none; font-weight: 500;"></div>
    `;
}

function volverAColores() {
    const container = document.getElementById("tamanosContainer");
    const grid = document.querySelector('.colores-grid');

    container.style.display = "none";
    if (grid) grid.style.display = "";
}

function agregarDesdeGrande(codigo, tipo, nombreColor, tamano, precio, stock) {
    const qtyInput = document.getElementById("qty-add-large");
    const qty = parseInt(qtyInput.value);
    const errorMsg = document.getElementById("stock-error-msg");

    if (errorMsg) errorMsg.style.display = "none";

    if (isNaN(qty) || qty <= 0) {
        if (errorMsg) {
            errorMsg.textContent = "Por favor, ingresa una cantidad válida.";
            errorMsg.style.display = "block";
        }
        return;
    }

    if (qty > stock) {
        if (errorMsg) {
            errorMsg.textContent = `Stock insuficiente. Solo hay ${stock} unidades disponibles.`;
            errorMsg.style.display = "block";
        }
        return;
    }

    const itemExistente = cart.find(item => item.codigo === codigo);
    if (itemExistente && (itemExistente.cantidad + qty > stock)) {
        if (errorMsg) {
            const restantes = stock - itemExistente.cantidad;
            errorMsg.textContent = `Ya tienes ${itemExistente.cantidad} en el carrito. Solo puedes agregar ${restantes} más.`;
            errorMsg.style.display = "block";
        }
        return;
    }

    if (itemExistente) {
        itemExistente.cantidad += qty;
    } else {
        cart.push({
            codigo: codigo,
            tipo_hilo: tipo,
            tipo: tipo,
            nombreColor: nombreColor,
            tamano: tamano,
            precio: precio,
            cantidad: qty,
            stockMax: stock
        });
    }

    if (typeof renderCart === 'function') {
        renderCart();
    }

    const controlsDiv = document.querySelector('.purchase-controls');
    if (controlsDiv) {
        controlsDiv.style.flexDirection = "column";
        controlsDiv.innerHTML = `
            <div style="background-color: #d4edda; color: #155724; padding: 8px; border-radius: 5px; text-align: center; font-size: 0.9rem; font-weight: bold; margin-bottom: 10px; width: 100%;">
                ✓ ¡Producto agregado con éxito!
            </div>
            <div style="display: flex; gap: 10px; width: 100%;">
                <button onclick="volverAColores()" style="flex: 1; background-color: white; color: var(--navy); border: 1px solid var(--navy); padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                    ← Seguir comprando
                </button>
                <button onclick="openCart()" style="flex: 1; background-color: #28a745; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                    🛒 Ir al carrito
                </button>
            </div>
        `;
    }
}

function closeProduct() {
    productModal.classList.remove("active");
    document.body.classList.remove("modal-open");
}

productModal.addEventListener("click", e => { if (e.target === productModal) closeProduct(); });

/* ========================================================
   CARRITO AVANZADO Y CHECKOUT
======================================================== */
let cart = [];
let checkoutStep = false;
const cartModal = document.getElementById("cartModal");

function agregarAlCarrito(codigo, tipo, color, tamano, precio, stockMax) {
    const inputCant = document.getElementById(`qty-add-${codigo}`);
    let cantSeleccionada = inputCant ? parseInt(inputCant.value) : 1;
    if (isNaN(cantSeleccionada) || cantSeleccionada < 1) cantSeleccionada = 1;

    const existente = cart.find(item => item.codigo === codigo);
    if (existente) {
        if((existente.cantidad + cantSeleccionada) <= stockMax) {
            existente.cantidad += cantSeleccionada;
        } else {
            alert(`Stock insuficiente. Ya tienes ${existente.cantidad} en el carrito y solo hay ${stockMax} disponibles.`);
            return;
        }
    } else {
        if(cantSeleccionada <= stockMax) {
            cart.push({ codigo, tipo, color, tamano, precio, cantidad: cantSeleccionada, stockMax });
        } else {
            alert(`Stock insuficiente. Solo hay ${stockMax} unidades disponibles.`);
            return;
        }
    }
    closeProduct();
    openCart();
}

function renderCart() {
    checkoutStep = false;
    document.getElementById("checkoutFields").style.display = "none";
    document.getElementById("cartResult").textContent = "";

    const cartBadge = document.getElementById("cartBadge");
    const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? "flex" : "none";

    const container = document.getElementById("cartItemsContainer");

    if (cart.length === 0) {
        container.innerHTML = `<p class="cart-empty">Tu carrito está vacío.</p>`;
        document.getElementById("cartTotalRow").style.display = "none";
        document.getElementById("cartActionsBlock").innerHTML = "";
        return;
    }

    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <strong>${item.tipo || item.tipo_hilo} - ${item.nombreColor || item.color} (${item.tamano})</strong>
                <span>Cód: ${item.codigo} | Q${Number(item.precio).toFixed(2)} c/u</span>
            </div>
            <div class="cart-item-controls">
                <button type="button" class="qty-btn" onclick="cambiarCantidad(${index}, -1)">−</button>
                <input type="number" class="cart-qty-input" value="${item.cantidad}" min="1" max="${item.stockMax}" onchange="escribirCantidad(${index}, this.value)">
                <button type="button" class="qty-btn" onclick="cambiarCantidad(${index}, 1)">+</button>
                <button type="button" class="cart-item-remove" onclick="removeFromCart(${index})" title="Eliminar producto completo">🗑️ Quitar</button>
            </div>
        </div>
    `).join("");

    const total = cart.reduce((sum, item) => sum + item.cantidad * item.precio, 0);
    document.getElementById("cartTotalAmount").textContent = `Q${total.toFixed(2)}`;
    document.getElementById("cartTotalRow").style.display = "flex";

    document.getElementById("cartActionsBlock").innerHTML = `
        <button type="button" class="button button-primary" style="width:100%; margin-bottom:10px;" onclick="iniciarCheckout()">
            Finalizar Compra
        </button>
        <button type="button" class="button button-outline" style="width:100%; color:var(--navy); border-color:var(--border);" onclick="closeCart()">
            Continuar Comprando
        </button>
    `;
}

function cambiarCantidad(index, delta) {
    const item = cart[index];
    const nuevaCant = item.cantidad + delta;
    if(nuevaCant > 0 && nuevaCant <= item.stockMax) {
        item.cantidad = nuevaCant;
        renderCart();
    } else if (nuevaCant > item.stockMax) {
        alert(`Stock máximo alcanzado. Solo hay ${item.stockMax} unidades.`);
    }
}

function escribirCantidad(index, valor) {
    const item = cart[index];
    const nuevaCant = parseInt(valor);
    if (isNaN(nuevaCant) || nuevaCant < 1) {
        renderCart();
        return;
    }
    if (nuevaCant <= item.stockMax) {
        item.cantidad = nuevaCant;
    } else {
        alert(`Stock máximo alcanzado. Solo hay ${item.stockMax} unidades.`);
        item.cantidad = item.stockMax;
    }
    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function openCart() {
    renderCart();
    cartModal.classList.add("active");
    document.body.classList.add("modal-open");
}

function closeCart() {
    cartModal.classList.remove("active");
    document.body.classList.remove("modal-open");
}

cartModal.addEventListener("click", e => { if (e.target === cartModal) closeCart(); });

function iniciarCheckout() {
    checkoutStep = true;
    document.getElementById("checkoutFields").style.display = "block";

    document.getElementById("cartActionsBlock").innerHTML = `
        <button type="button" class="button button-primary" style="width:100%; margin-bottom:10px;" onclick="enviarPedido()">
            Confirmar Reserva (Vía WhatsApp)
        </button>
        <button type="button" class="button button-outline" style="width:100%; color:var(--muted); border-color:var(--border);" onclick="renderCart()">
            ← Volver al carrito
        </button>
    `;
}

function enviarPedido() {
    const nombre = document.getElementById("checkoutName").value.trim();
    const telefono = document.getElementById("checkoutPhone").value.trim();
    const correo = document.getElementById("checkoutEmail").value.trim();
    const fecha = document.getElementById("checkoutDate").value;
    const boton = document.querySelector("#cartActionsBlock .button-primary");

    if (!nombre || !telefono || !correo || !fecha) {
        document.getElementById("cartResult").textContent = "Debes completar el Nombre, Teléfono, Correo Electrónico y Fecha de Recogida.";
        document.getElementById("cartResult").className = "order-result error";
        return;
    }

    if (cart.length === 0) return;

    boton.textContent = "Guardando orden...";
    boton.disabled = true;

    const datosPedido = {
        nombre: nombre,
        telefono: telefono,
        correo: correo,
        fecha: fecha,
        carrito: cart
    };

    fetch(`${API_URL}/guardar_pedido.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosPedido)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            const numeroOrden = data.numero_orden;

            cart.forEach(item => {
                const productoVisual = inventarioOracle.find(inv =>
                    (inv.codigo_interno === item.codigo || inv.CODIGO_INTERNO === item.codigo)
                );
                if (productoVisual) {
                    if (productoVisual.stock !== undefined) productoVisual.stock -= item.cantidad;
                    if (productoVisual.STOCK !== undefined) productoVisual.STOCK -= item.cantidad;
                }
            });

            let mensaje = `*NUEVA ORDEN DISTEXMA: ${numeroOrden}*\n\n`;
            mensaje += `*Nombre:* ${nombre}\n`;
            mensaje += `*Teléfono:* ${telefono}\n`;
            mensaje += `*Correo:* ${correo}\n`;
            mensaje += `*Fecha de recogida:* ${fecha}\n\n`;
            mensaje += `*DETALLE DEL PEDIDO:*\n`;

            let totalPedido = 0;
            cart.forEach(item => {
                const subtotal = item.precio * item.cantidad;
                totalPedido += subtotal;
                mensaje += `- ${item.cantidad}x [${item.codigo}] ${item.nombreColor || item.color} (${item.tamano}) : Q${subtotal}\n`;
            });

            mensaje += `\n*TOTAL A PAGAR: Q${totalPedido}*`;

            document.getElementById("cartResult").textContent = `¡Reserva guardada! Orden: ${numeroOrden}. Redirigiendo a WhatsApp...`;
            document.getElementById("cartResult").className = "order-result";
            document.getElementById("cartResult").style.color = "var(--navy)";

            const numeroWhatsApp = "50245947651";
            window.open(`https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`, '_blank');

            cart = [];
            renderCart();
            setTimeout(closeCart, 3000);

        } else {
            throw new Error(data.mensaje);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById("cartResult").textContent = "Fallo al guardar en BD: " + error.message;
        document.getElementById("cartResult").className = "order-result error";
    })
    .finally(() => {
        boton.textContent = "Confirmar Reserva y Enviar";
        boton.disabled = false;
    });
}

/* ========================================================
   EFECTO MAGICO: HILOS DESHILÁNDOSE CON EL SCROLL
======================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const hilosSVG = [
        document.getElementById('hilo-azul'),
        document.getElementById('hilo-amarillo'),
        document.getElementById('hilo-rojo')
    ];

    hilosSVG.forEach(hilo => {
        if(hilo) {
            const length = hilo.getTotalLength();
            hilo.style.strokeDasharray = length;
            hilo.style.strokeDashoffset = length;
        }
    });

    window.addEventListener('scroll', () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const windowHeight = document.documentElement.clientHeight;
        const docHeight = document.documentElement.scrollHeight;

        const scrollPercent = (scrollTop + windowHeight) / docHeight;

        hilosSVG.forEach(hilo => {
            if(hilo) {
                const length = hilo.getTotalLength();
                const draw = length * scrollPercent;
                hilo.style.strokeDashoffset = length - draw;
            }
        });
    }, { passive: true });
});

/* ========================================================
   INTERACTIVIDAD PREMIUM (Cursor Dinámico y Parallax 3D)
======================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    if (cursorDot && cursorOutline && window.innerWidth > 992) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 400, fill: "forwards" });
        });

        const agregarEfectoHover = () => {
            const clickables = document.querySelectorAll('a, button, .color-item, .size-pill, .product-card, input');
            clickables.forEach(el => {
                el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
                el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
            });
        };

        agregarEfectoHover();
        const observer = new MutationObserver(agregarEfectoHover);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    const heroSection = document.querySelector('.hero');
    const cardMain = document.querySelector('.hero-card-main');
    const cardSmall = document.querySelector('.hero-card-small');

    if (heroSection && cardMain && cardSmall && window.innerWidth > 992) {
        heroSection.addEventListener('mousemove', (e) => {
            const x = (window.innerWidth / 2 - e.pageX) / 45;
            const y = (window.innerHeight / 2 - e.pageY) / 45;

            cardMain.style.transform = `rotate(2deg) translate(${x}px, ${y}px)`;
            cardSmall.style.transform = `rotate(-5deg) translate(${-x}px, ${-y}px)`;
        });

        heroSection.addEventListener('mouseleave', () => {
            cardMain.style.transform = `rotate(2deg) translate(0px, 0px)`;
            cardSmall.style.transform = `rotate(-5deg) translate(0px, 0px)`;
            cardMain.style.transition = 'transform 0.5s ease-out';
            cardSmall.style.transition = 'transform 0.5s ease-out';

            setTimeout(() => {
                cardMain.style.transition = '';
                cardSmall.style.transition = '';
            }, 500);
        });
    }
});

/* ========================================================
   BUSCADOR RÁPIDO Y APERTURA NATIVA DE PRODUCTO
======================================================== */
function ejecutarBusquedaWeb(texto) {
    const query = texto.trim().toUpperCase();
    const contenedorResultados = document.getElementById("resultadosBusquedaWeb");

    if (!query) {
        contenedorResultados.innerHTML = "";
        return;
    }

    const encontrados = inventarioOracle.filter(item => {
        const cod = item.codigo_interno || item.CODIGO_INTERNO;
        return cod && cod.toUpperCase().includes(query);
    }).slice(0, 10);

    if (encontrados.length === 0) {
        contenedorResultados.innerHTML = `<p style="font-size: 12px; color: #64748B; padding: 5px;">No se encontraron hilos.</p>`;
        return;
    }

    let htmlResultados = "";
    encontrados.forEach(item => {
        const cod = item.codigo_interno || item.CODIGO_INTERNO;
        const tipo = item.tipo_hilo || item.TIPO_HILO;
        const colorN = item.color_nombre || item.COLOR_NOMBRE;
        const hexC = item.codigo_hex || item.CODIGO_HEX;
        const tamN = item.tamano || item.TAMANO;
        const precioN = item.precio || item.PRECIO;
        const stockN = item.stock || item.STOCK;

        htmlResultados += `
            <div onclick="seleccionarProductoWeb('${cod}')" style="display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #F1F5F9; cursor: pointer; background: #FAFAFA; border-radius: 6px; margin-bottom: 4px;">
                <div style="width: 26px; height: 26px; border-radius: 50%; background-color: ${hexC}; border: 1px solid #ddd; flex-shrink: 0;"></div>
                <div style="flex: 1; margin-left: 10px;">
                    <strong style="font-size: 12px; color: #1557A6;">${tipo} - ${colorN} (${tamN})</strong>
                    <div style="font-size: 11px; color: #64748B;">Cód: ${cod} | Stock: ${stockN} | Q${precioN}</div>
                </div>
                <span style="color: #1557A6; font-weight: bold; font-size: 14px;">→</span>
            </div>
        `;
    });

    contenedorResultados.innerHTML = htmlResultados;
}

function seleccionarProductoWeb(codigoBuscado) {
    const producto = inventarioOracle.find(inv =>
        (inv.codigo_interno === codigoBuscado || inv.CODIGO_INTERNO === codigoBuscado)
    );

    if (!producto) return;

    document.getElementById("inputBusquedaWeb").value = "";
    document.getElementById("resultadosBusquedaWeb").innerHTML = "";

    const tipo = producto.tipo_hilo || producto.TIPO_HILO;
    const hex = producto.codigo_hex || producto.CODIGO_HEX;
    const colorNombre = producto.color_nombre || producto.COLOR_NOMBRE;

    let idHtmlEncontrado = 'capuano';
    if (tipo.toLowerCase().includes('sedalina')) idHtmlEncontrado = 'sedalina';
    else if (tipo.toLowerCase().includes('zim')) idHtmlEncontrado = 'zim';

    openProduct(idHtmlEncontrado);

    setTimeout(() => {
        seleccionarColor(hex, colorNombre);
    }, 100);
}