<?php
// conexion.php - Oracle Autonomous Database (configuración por variables de entorno)
//
// Variables necesarias:
//   DB_USER  -> DISTEXMA
//   DB_PASS  -> contraseña del usuario DISTEXMA
//   DB_DSN   -> cadena de conexión TLS completa (ver guía), sin wallet
function conectarOracle() {
    $usuario = getenv('DB_USER') ?: 'DISTEXMA';
    $password = getenv('DB_PASS');
    $dsn = getenv('DB_DSN');

    if (!$password || !$dsn) {
        throw new Exception("Faltan las variables de entorno DB_PASS o DB_DSN.");
    }

    // AL32UTF8 es crucial para que los acentos y las ñ funcionen bien
    $pdo = new PDO("oci:dbname=" . $dsn . ";charset=AL32UTF8", $usuario, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $pdo;
}
?>
