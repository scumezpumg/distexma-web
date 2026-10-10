<?php
ini_set('display_errors', 0);
error_reporting(0);

require 'cors.php';
header('Content-Type: application/json; charset=utf-8');
require 'conexion.php';

try {
    $pdo = conectarOracle();

    $stmt = $pdo->prepare("SELECT id_tipo, nombre, abreviatura FROM tipos_hilo");
    $stmt->execute();

    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    echo json_encode(["error" => "Error en la consulta: " . $e->getMessage()]);
}
?>