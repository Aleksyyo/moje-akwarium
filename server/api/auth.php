<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../classes/User.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$userHandler = new User();
$response = ['success' => false, 'message' => 'Nieprawidłowa akcja.'];
$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($action === 'register') {
        $username = $input['username'] ?? null;
        $password = $input['password'] ?? null;
        $response = $userHandler->register($username, $password);
    } elseif ($action === 'login') {
        $username = $input['username'] ?? null;
        $password = $input['password'] ?? null;
        $response = $userHandler->login($username, $password);
    } else {
        $response = ['success' => false, 'message' => 'Nieznana akcja POST. Dostępne: register, login.'];
    }
} else {
    http_response_code(405);
    $response = ['success' => false, 'message' => 'Metoda HTTP nie jest obsługiwana. Użyj POST.'];
}

if (isset($response['success']) && !$response['success']) {
    if (strpos($response['message'], 'Błąd serwera') !== false) {
        http_response_code(500);
    } else if (strpos($response['message'], 'wymagane') !== false || strpos($response['message'], 'Nieprawidłowy') !== false || strpos($response['message'], 'już istnieje') !== false) {
        http_response_code(400);
    } else if (strpos($response['message'], 'Nieprawidłowa nazwa użytkownika lub hasło') !== false) {
        http_response_code(401);
    }
} else if (isset($response['success']) && $response['success'] && $action === 'register') {
    http_response_code(201);
} else if (isset($response['success']) && $response['success'] && $action === 'login') {
    http_response_code(200);
}

echo json_encode($response);
exit();
?>
