<?php
// api_catalogo.php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // Vital para tu futura app móvil
require 'conexion.php';

try {
    $pdo = conectarOracle();
    
    // Consulta SQL que une todo lo que necesita tu frontend
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
    
    $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($resultados);
    
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>