<?php
header('Content-Type: application/json');
$datos = json_decode(file_get_contents("php://input"), true);

if (!$datos || empty($datos['carrito'])) {
    echo json_encode(["status" => "error", "mensaje" => "El carrito está vacío."]);
    exit;
}

try {
    // Asegúrate de que este archivo contiene tu función conectarOracle()
    require_once 'conexion.php'; 
    $pdo = conectarOracle();
    
    // Iniciamos la transacción (para no guardar a medias si algo falla)
    $pdo->beginTransaction();

    $nombre = $datos['nombre'];
    $telefono = $datos['telefono'];
    $fecha = $datos['fecha'];
    $carrito = $datos['carrito'];
    
    // Calcular el total
    $total = 0;
    foreach($carrito as $item) {
        $total += ($item['precio'] * $item['cantidad']);
    }

    // 1. Insertar en tabla PEDIDOS (el Trigger trg_preparar_pedido generará el numero_orden DX-xxxx)
    $sqlPedido = "INSERT INTO pedidos (nombre_cliente, telefono, fecha_recogida, total) 
                  VALUES (:nombre, :telefono, TO_DATE(:fecha, 'YYYY-MM-DD'), :total)";
    $stmt = $pdo->prepare($sqlPedido);
    $stmt->execute([
        ':nombre' => $nombre,
        ':telefono' => $telefono,
        ':fecha' => $fecha,
        ':total' => $total
    ]);

    // 2. Obtener el id_pedido y numero_orden (DX-0001) recién generado
    $sqlLast = "SELECT id_pedido, numero_orden FROM pedidos WHERE id_pedido = (SELECT MAX(id_pedido) FROM pedidos WHERE telefono = :telefono)";
    $stmtLast = $pdo->prepare($sqlLast);
    $stmtLast->execute([':telefono' => $telefono]);
    $rowPedido = $stmtLast->fetch(PDO::FETCH_ASSOC);
    
    // Compatible con mayúsculas/minúsculas de Oracle
    $id_pedido = $rowPedido['ID_PEDIDO'] ?? $rowPedido['id_pedido'];
    $numero_orden = $rowPedido['NUMERO_ORDEN'] ?? $rowPedido['numero_orden'];

    // 3. Insertar cada hilo en DETALLES_PEDIDO y ACTUALIZAR STOCK
    // Preparar el insert de detalles
    $sqlDetalle = "INSERT INTO detalles_pedido (id_pedido, id_inventario, cantidad, precio_unitario) 
                   VALUES (:id_pedido, (SELECT id_inventario FROM inventario WHERE codigo_interno = :codigo), :cantidad, :precio)";
    $stmtDetalle = $pdo->prepare($sqlDetalle);

    // Preparar el update de stock
    $sqlUpdateStock = "UPDATE inventario SET stock = stock - :cantidad WHERE codigo_interno = :codigo";
    $stmtUpdateStock = $pdo->prepare($sqlUpdateStock);

    foreach($carrito as $item) {
        // Insertar el detalle
        $stmtDetalle->execute([
            ':id_pedido' => $id_pedido,
            ':codigo' => $item['codigo'],
            ':cantidad' => $item['cantidad'],
            ':precio' => $item['precio']
        ]);
        
        // Descontar del inventario
        $stmtUpdateStock->execute([
            ':cantidad' => $item['cantidad'],
            ':codigo' => $item['codigo']
        ]);
    }

    // Confirmamos la transacción
    $pdo->commit();
    echo json_encode(["status" => "success", "numero_orden" => $numero_orden]);

} catch (Exception $e) {
    if(isset($pdo)) $pdo->rollBack();
    echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
}
?>