<?php
ini_set('display_errors', 0);
error_reporting(0);

require 'cors.php';
header('Content-Type: application/json; charset=utf-8');
require 'conexion.php';

try {
    $pdo = conectarOracle();

    $sql = "SELECT 
                i.codigo_interno,
                t.nombre AS tipo_hilo,
                c.nombre AS color_nombre,
                c.codigo_hex,
                tam.nombre_tamano AS tamano,
                tam.precio,
                i.stock
            FROM inventario i
            JOIN tipos_hilo t ON i.id_tipo = t.id_tipo
            JOIN colores c ON i.id_color = c.id_color
            JOIN tamanos_precio tam ON i.id_tamano = tam.id_tamano
            ORDER BY t.id_tipo ASC, c.orden_cromatico ASC, tam.precio ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();

    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>