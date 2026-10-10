<?php
ini_set('display_errors', 0);
error_reporting(0);

require 'cors.php';
header('Content-Type: application/json; charset=utf-8');

$datos = json_decode(file_get_contents("php://input"), true);

if (!$datos || empty($datos['carrito'])) {
    echo json_encode(["status" => "error", "mensaje" => "El carrito está vacío."]);
    exit;
}

try {
    require_once 'conexion.php';
    $pdo = conectarOracle();
    $pdo->beginTransaction();

    // ... TODO LO DEMÁS IGUAL que tu código actual ...

    $pdo->commit();
    echo json_encode(["status" => "success", "numero_orden" => $numero_orden]);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(["status" => "error", "mensaje" => $e->getMessage()]);
}
?>