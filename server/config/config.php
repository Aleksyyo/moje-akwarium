<?php
// server/config/config.php

define('PROJECT_ROOT_PATH', dirname(dirname(__DIR__)));
define('SERVER_ROOT_PATH', dirname(__DIR__));
define('PUBLIC_PATH', PROJECT_ROOT_PATH . '/public');


require_once PROJECT_ROOT_PATH . '/vendor/autoload.php';


define('DB_TYPE', 'sqlite');
define('DB_PATH', SERVER_ROOT_PATH . '/database/aquarium.sqlite');


define('JWT_SECRET_KEY', 'klucz12345');
define('JWT_ISSUER', 'http://localhost/moje-akwarium');
define('JWT_AUDIENCE', 'http://localhost/moje-akwarium');
define('JWT_ALGORITHM', 'HS256');
define('JWT_EXPIRATION_TIME', 3600);

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

date_default_timezone_set('Europe/Warsaw');

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>
