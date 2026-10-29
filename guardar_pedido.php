<?php
ini_set('display_errors', 0);
error_reporting(0);

require 'cors.php';
header('Content-Type: application/json; charset=utf-8');

$datos = json_decode(file_get_contents("php://input"), true);

if (!$datos || empty($datos['carrito']) || !is_array($datos['carrito'])) {
    echo json_encode(["status" => "error", "mensaje" => "El carrito está vacío."]);
    exit;
}

$nombre   = trim($datos['nombre']   ?? '');
$telefono = trim($datos['telefono'] ?? '');
$correo   = trim($datos['correo']   ?? '');
$fecha    = trim($datos['fecha']    ?? '');

if ($nombre === '' || $telefono === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
    echo json_encode(["status" => "error", "mensaje" => "Faltan datos del cliente."]);
    exit;
}

try {
    require_once 'conexion.php';
    $pdo = conectarOracle();
    $pdo->beginTransaction();

    // Número de orden (DX-0001...) generado con la secuencia
    $numero_orden = $pdo->query("SELECT 'DX-' || LPAD(seq_ordenes_dx.NEXTVAL, 4, '0') AS n FROM dual")
                        ->fetch(PDO::FETCH_NUM)[0];

    // Primero el pedido (total en 0; se actualiza al final)
    $stmt = $pdo->prepare(
        "INSERT INTO pedidos (numero_orden, nombre_cliente, telefono, correo, fecha_recogida, total)
         VALUES (:orden, :nombre, :tel, :correo, TO_DATE(:fecha, 'YYYY-MM-DD'), 0)"
    );
    $stmt->execute([
        ':orden' => $numero_orden, ':nombre' => $nombre, ':tel' => $telefono,
        ':correo' => $correo, ':fecha' => $fecha
    ]);

    $stmt = $pdo->prepare("SELECT id_pedido FROM pedidos WHERE numero_orden = :orden");
    $stmt->execute([':orden' => $numero_orden]);
    $id_pedido = $stmt->fetch(PDO::FETCH_NUM)[0];

    $buscar = $pdo->prepare(
        "SELECT i.id_inventario, tam.precio
           FROM inventario i
           JOIN tamanos_precio tam ON tam.id_tamano = i.id_tamano
          WHERE i.codigo_interno = :cod"
    );
    // Descuenta stock solo si alcanza (operación atómica)
    $descontar = $pdo->prepare(
        "UPDATE inventario SET stock = stock - :cant1 WHERE id_inventario = :id AND stock >= :cant2"
    );
    $detalle = $pdo->prepare(
        "INSERT INTO detalles_pedido (id_pedido, id_inventario, cantidad, precio_unitario)
         VALUES (:ped, :inv, :cant, :precio)"
    );

    $total = 0;
    foreach ($datos['carrito'] as $item) {
        $codigo   = trim($item['codigo'] ?? '');
        $cantidad = (int)($item['cantidad'] ?? 0);
        if ($codigo === '' || $cantidad < 1) {
            throw new Exception("Producto inválido en el carrito.");
        }

        $buscar->execute([':cod' => $codigo]);
        $fila = $buscar->fetch(PDO::FETCH_NUM);
        if (!$fila) {
            throw new Exception("El producto $codigo no existe.");
        }
        $id_inv = $fila[0];
        $precio = (float)$fila[1]; // precio SIEMPRE desde la base de datos

        $descontar->execute([':cant1' => $cantidad, ':id' => $id_inv, ':cant2' => $cantidad]);
        if ($descontar->rowCount() === 0) {
            throw new Exception("No hay stock suficiente de $codigo.");
        }

        $detalle->execute([':ped' => $id_pedido, ':inv' => $id_inv, ':cant' => $cantidad, ':precio' => $precio]);
        $total += $precio * $cantidad;
    }

    $stmt = $pdo->prepare("UPDATE pedidos SET total = :total WHERE id_pedido = :id");
    $stmt->execute([':total' => $total, ':id' => $id_pedido]);

    $pdo->commit();
    echo json_encode(["status" => "success", "numero_orden" => $numero_orden]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
}
?>
