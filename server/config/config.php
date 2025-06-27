<?php
// server/config/config.php

// Ostrzeżenie: zmień JWT_SECRET_KEY na własny klucz w środowisku produkcyjnym!
define('PROJECT_ROOT_PATH', dirname(dirname(__DIR__))); // Główny katalog projektu (moje-akwarium)
define('SERVER_ROOT_PATH', dirname(__DIR__)); // Główny katalog serwera (server)
define('PUBLIC_PATH', PROJECT_ROOT_PATH . '/public');

// Dołącz autoloader Composera
require_once PROJECT_ROOT_PATH . '/vendor/autoload.php';

// Ustawienia bazy danych (dla SQLite)
define('DB_TYPE', 'sqlite');
define('DB_PATH', SERVER_ROOT_PATH . '/database/aquarium.sqlite');

// Ustawienia dla JWT
define('JWT_SECRET_KEY', 'klucz12345'); // ZMIEŃ NA SWÓJ!
define('JWT_ISSUER', 'http://localhost/moje-akwarium');
define('JWT_AUDIENCE', 'http://localhost/moje-akwarium');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION_TIME', 3600); // Czas ważności tokenu w sekundach (np. 1 godzina)

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

date_default_timezone_set('Europe/Warsaw');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
// Dodajemy 'Authorization' do dozwolonych nagłówków dla JWT
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
