<?php
// conexion.php
function conectarOracle() {
    $host = "localhost";
    $puerto = "1521";
    $servicio = "XEPDB1";
    $usuario = "system"; // El usuario que te funcionó
    $password = "cuborubik"; // Cambia esto por tu contraseña real de system

    $tns = "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=$host)(PORT=$puerto))(CONNECT_DATA=(SERVICE_NAME=$servicio)))";

    try {
        // AL32UTF8 es crucial para que los acentos y las ñ funcionen bien
        $pdo = new PDO("oci:dbname=" . $tns . ";charset=AL32UTF8", $usuario, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        die(json_encode(["error" => "Error de conexión: " . $e->getMessage()]));
    }
}
?>