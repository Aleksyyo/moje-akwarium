<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth_middleware.php';
require_once __DIR__ . '/../classes/Database.php';

header('Content-Type: application/json');

$userData = authenticateUser();
$userId = $userData['userId'];

$response = ['success' => false, 'message' => 'Nieznana operacja na akwarium.'];
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

try {
    $pdo = Database::getInstance()->getConnection();

    // --- Funkcja pomocnicza: pobieranie lub tworzenie ustawień użytkownika w bazie ---
    function getOrCreateUserSettings($pdo, $userId) {
        $stmt = $pdo->prepare("SELECT * FROM user_aquarium_settings WHERE user_id = :user_id");
        $stmt->execute(['user_id' => $userId]);
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$settings) {
            // Jeśli nie ma ustawień, utwórz domyślne
            $pdo->prepare("INSERT INTO user_aquarium_settings (user_id) VALUES (:user_id)")
                ->execute(['user_id' => $userId]);
            // Pobierz nowo utworzone ustawienia
            $stmt->execute(['user_id' => $userId]);
            $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return $settings;
    }

    // --- Funkcja pomocnicza: dynamiczne wyliczanie wskaźników głodu i brudu na podstawie czasu ---
    function calculateLevels($settings) {
        // Parametry: ile czasu (w sekundach) do pełnego 100%
        $maxSeconds = 3600; // 1 godzina do pełnego 100
        $now = time();
        // GŁÓD
        $lastFed = isset($settings['last_fed_at']) && $settings['last_fed_at'] ? strtotime($settings['last_fed_at']) : null;
        if ($lastFed) {
            $delta = $now - $lastFed;
            $hunger = min(100, max(0, round($delta / $maxSeconds * 100)));
        } else {
            $hunger = 100;
        }
        // BRUD
        $lastCleaned = isset($settings['last_cleaned_at']) && $settings['last_cleaned_at'] ? strtotime($settings['last_cleaned_at']) : null;
        if ($lastCleaned) {
            $delta = $now - $lastCleaned;
            $dirt = min(100, max(0, round($delta / $maxSeconds * 100)));
        } else {
            $dirt = 100;
        }
        $settings['hunger_level'] = $hunger;
        $settings['dirt_level'] = $dirt;
        return $settings;
    }

    // --- Obsługa endpointów API: GET ustawień, POST toggle_light/feed/clean ---
    if ($method === 'GET' && $action === null) { // Pobieranie ustawień
        $settings = getOrCreateUserSettings($pdo, $userId);
        $settings = calculateLevels($settings);
        $settings['light_on'] = (bool)$settings['light_status'];
        unset($settings['light_status']);
        $response = ['success' => true, 'settings' => $settings];
        http_response_code(200);

    } elseif ($method === 'POST') {
        $currentSettings = getOrCreateUserSettings($pdo, $userId);

        if ($action === 'toggle_light') {
            $newLightStatus = $currentSettings['light_status'] == 1 ? 0 : 1;
            $stmt = $pdo->prepare("UPDATE user_aquarium_settings SET light_status = :light_status WHERE user_id = :user_id");
            $stmt->execute(['light_status' => $newLightStatus, 'user_id' => $userId]);
            $settings = getOrCreateUserSettings($pdo, $userId);
            $settings = calculateLevels($settings);
            $response = [
                'success' => true,
                'message' => 'Światło przełączone.',
                'light_on' => (bool)$newLightStatus,
                'last_fed_at' => $settings['last_fed_at'],
                'last_cleaned_at' => $settings['last_cleaned_at'],
                'hunger_level' => $settings['hunger_level'],
                'dirt_level' => $settings['dirt_level']
            ];
            http_response_code(200);

        } elseif ($action === 'feed') {
            $now = date('Y-m-d H:i:s');
            $stmt = $pdo->prepare("UPDATE user_aquarium_settings SET last_fed_at = :now, hunger_level = 0 WHERE user_id = :user_id");
            $stmt->execute(['now' => $now, 'user_id' => $userId]);
            $response = ['success' => true, 'message' => 'Ryby nakarmione.', 'last_fed_at' => $now, 'hunger_level' => 0];
            http_response_code(200);

        } elseif ($action === 'clean') {
            $now = date('Y-m-d H:i:s');
            $stmt = $pdo->prepare("UPDATE user_aquarium_settings SET last_cleaned_at = :now, dirt_level = 0 WHERE user_id = :user_id");
            $stmt->execute(['now' => $now, 'user_id' => $userId]);
            $response = ['success' => true, 'message' => 'Akwarium wyczyszczone.', 'last_cleaned_at' => $now, 'dirt_level' => 0];
            http_response_code(200);
        } else {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'Nieprawidłowa akcja POST dla akwarium.'];
        }
    } else {
        http_response_code(405); // Method Not Allowed
        $response = ['success' => false, 'message' => 'Niedozwolona metoda HTTP dla tego endpointu.'];
    }

} catch (PDOException $e) {
    error_log("Błąd API aquarium: " . $e->getMessage());
    http_response_code(500);
    $response = ['success' => false, 'message' => 'Błąd serwera podczas operacji na ustawieniach akwarium.'];
} catch (Exception $e) {
    http_response_code(500);
    $response = ['success' => false, 'message' => $e->getMessage()];
}

echo json_encode($response);
exit();
?>
