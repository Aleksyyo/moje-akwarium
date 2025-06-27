<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth_middleware.php';
require_once __DIR__ . '/../classes/Database.php';

header('Content-Type: application/json');

// Autoryzacja użytkownika
$userData = authenticateUser();
$userId = $userData['userId'];

$response = ['success' => false, 'message' => 'Nieznana operacja na rybach.'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = Database::getInstance()->getConnection();

    if ($method === 'GET') {
        // Pobierz wszystkie ryby użytkownika wraz z nazwą gatunku i ścieżką obrazka
        $stmt = $pdo->prepare("
            SELECT f.id, f.name, f.added_at, f.weight, f.size, f.description, fs.name as species_name, fs.image_path as species_image_path
            FROM fish f
            JOIN fish_species fs ON f.species_id = fs.id
            WHERE f.user_id = :user_id
            ORDER BY f.added_at DESC
        ");
        $stmt->execute(['user_id' => $userId]);
        $fish = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response = ['success' => true, 'fish' => $fish];
        http_response_code(200);

    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $fishName = $input['name'] ?? null;
        $speciesId = $input['species_id'] ?? null;
        $weight = isset($input['weight']) ? $input['weight'] : null;
        $size = isset($input['size']) ? $input['size'] : null;
        $description = isset($input['description']) ? $input['description'] : null;

        if (empty($fishName) || empty($speciesId)) {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'Nazwa ryby i ID gatunku są wymagane.'];
        } else {
            // Walidacja: sprawdź, czy gatunek istnieje
            $stmtCheck = $pdo->prepare("SELECT id FROM fish_species WHERE id = :species_id");
            $stmtCheck->execute(['species_id' => $speciesId]);
            if (!$stmtCheck->fetch()) {
                http_response_code(400);
                $response = ['success' => false, 'message' => 'Wybrany gatunek nie istnieje.'];
            } else {
                $stmt = $pdo->prepare("INSERT INTO fish (user_id, name, species_id, weight, size, description) VALUES (:user_id, :name, :species_id, :weight, :size, :description)");
                $stmt->execute([
                    'user_id' => $userId,
                    'name' => $fishName,
                    'species_id' => $speciesId,
                    'weight' => $weight,
                    'size' => $size,
                    'description' => $description
                ]);
                $newFishId = $pdo->lastInsertId();
                $response = ['success' => true, 'message' => 'Ryba dodana pomyślnie.', 'fish_id' => $newFishId];
                http_response_code(201);
            }
        }
      } elseif ($method === 'DELETE') {
        $fishIdToDelete = $_GET['id'] ?? null;
        $deleteAll = isset($_GET['all']) && $_GET['all'] === 'true';

        if ($deleteAll) {
            // Usuwanie wszystkich ryb użytkownika
            $stmt = $pdo->prepare("DELETE FROM fish WHERE user_id = :user_id");
            $stmt->execute(['user_id' => $userId]);
            $deletedCount = $stmt->rowCount();
            $response = ['success' => true, 'message' => "Usunięto $deletedCount ryb."];
            http_response_code(200);

        } elseif (!empty($fishIdToDelete)) {
            $stmt = $pdo->prepare("DELETE FROM fish WHERE id = :id AND user_id = :user_id");
            $stmt->execute(['id' => $fishIdToDelete, 'user_id' => $userId]);
            if ($stmt->rowCount() > 0) {
                $response = ['success' => true, 'message' => 'Ryba usunięta pomyślnie.'];
                http_response_code(200);
            } else {
                http_response_code(404);
                $response = ['success' => false, 'message' => 'Nie znaleziono ryby lub brak uprawnień do usunięcia.'];
            }
        } else {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'ID ryby do usunięcia lub parametr "all=true" jest wymagany.'];
        }
    } else {
        http_response_code(405);
        $response = ['success' => false, 'message' => 'Niedozwolona metoda HTTP.'];
    }

} catch (PDOException $e) {
    error_log("Błąd API fish: " . $e->getMessage());
    http_response_code(500);
    $response = ['success' => false, 'message' => 'Błąd serwera podczas operacji na rybach.'];
} catch (Exception $e) {
    http_response_code(500);
    $response = ['success' => false, 'message' => $e->getMessage()];
}

echo json_encode($response);
exit();
?>
