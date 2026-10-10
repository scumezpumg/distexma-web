<?php
// Desactivar errores visibles para mantener un JSON limpio
ini_set('display_errors', 0);
error_reporting(0);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include 'conexion.php';

try {
    $pdo = conectarOracle();
    
    $sql = "SELECT id_tipo, nombre, abreviatura FROM tipos_hilo";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    
    $tipos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($tipos);

} catch (Exception $e) {
    echo json_encode(array("error" => "Error en la consulta: " . $e->getMessage()));
}
?>