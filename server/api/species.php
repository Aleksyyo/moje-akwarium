<?php
require_once __DIR__ . '/../config/config.php'; // Zawiera autoloader i ustawienia JWT
require_once __DIR__ . '/../includes/auth_middleware.php'; // Middleware do autentykacji
require_once __DIR__ . '/../classes/Database.php'; // Dostęp do bazy

header('Content-Type: application/json');

// Uwierzytelnij użytkownika. Jeśli token jest nieprawidłowy, skrypt zakończy działanie.
$userData = authenticateUser(); // Zwraca dane użytkownika z tokenu, np. ['userId' => 1, 'username' => 'test']

$response = ['success' => false, 'message' => 'Nie udało się pobrać gatunków.'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo = Database::getInstance()->getConnection();
        $stmt = $pdo->query("SELECT id, name, image_path FROM fish_species ORDER BY name ASC");
        $species = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response = ['success' => true, 'species' => $species];
        http_response_code(200);
    } catch (PDOException $e) {
        error_log("Błąd pobierania gatunków: " . $e->getMessage());
        $response = ['success' => false, 'message' => 'Błąd serwera podczas pobierania gatunków.'];
        http_response_code(500);
    }
} else {
    http_response_code(405); // Method Not Allowed
    $response = ['success' => false, 'message' => 'Dozwolona metoda: GET.'];
}

echo json_encode($response);
exit();
?>
