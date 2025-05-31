<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth_middleware.php';
require_once __DIR__ . '/../classes/Database.php'; // Będziemy potrzebować klasy Fish

// Na razie nie mamy klasy Fish, więc zrobimy prostą logikę tutaj
// W przyszłości przeniesiemy to do klasy Fish.php

header('Content-Type: application/json');

$userData = authenticateUser(); // Uwierzytelnij
$userId = $userData['userId']; // Pobierz ID zalogowanego użytkownika

$response = ['success' => false, 'message' => 'Nieznana operacja na rybach.'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = Database::getInstance()->getConnection();

    if ($method === 'GET') {
        // Pobierz wszystkie ryby dla zalogowanego użytkownika
        // Łączymy z fish_species, aby uzyskać nazwę gatunku i ścieżkę obrazka
        $stmt = $pdo->prepare("
            SELECT f.id, f.name, f.added_at, fs.name as species_name, fs.image_path as species_image_path
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

        if (empty($fishName) || empty($speciesId)) {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'Nazwa ryby i ID gatunku są wymagane.'];
        } else {
            // Sprawdź, czy gatunek istnieje (opcjonalne, ale dobre)
            $stmtCheck = $pdo->prepare("SELECT id FROM fish_species WHERE id = :species_id");
            $stmtCheck->execute(['species_id' => $speciesId]);
            if (!$stmtCheck->fetch()) {
                http_response_code(400);
                $response = ['success' => false, 'message' => 'Wybrany gatunek nie istnieje.'];
            } else {
                $stmt = $pdo->prepare("INSERT INTO fish (user_id, name, species_id) VALUES (:user_id, :name, :species_id)");
                $stmt->execute([
                    'user_id' => $userId,
                    'name' => $fishName,
                    'species_id' => $speciesId
                ]);
                $newFishId = $pdo->lastInsertId();
                $response = ['success' => true, 'message' => 'Ryba dodana pomyślnie.', 'fish_id' => $newFishId];
                http_response_code(201);
            }
        }
      } elseif ($method === 'DELETE') {
        $fishIdToDelete = $_GET['id'] ?? null;
        $deleteAll = isset($_GET['all']) && $_GET['all'] === 'true'; // Nowy parametr

        if ($deleteAll) {
            // Usuń wszystkie ryby dla zalogowanego użytkownika
            $stmt = $pdo->prepare("DELETE FROM fish WHERE user_id = :user_id");
            $stmt->execute(['user_id' => $userId]);
            $deletedCount = $stmt->rowCount();
            $response = ['success' => true, 'message' => "Usunięto $deletedCount ryb."];
            http_response_code(200);

        } elseif (!empty($fishIdToDelete)) {
            // Usuwanie pojedynczej ryby (istniejąca logika)
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
        http_response_code(405); // Method Not Allowed
        $response = ['success' => false, 'message' => 'Niedozwolona metoda HTTP.'];
    }

} catch (PDOException $e) {
    error_log("Błąd API fish: " . $e->getMessage());
    http_response_code(500);
    $response = ['success' => false, 'message' => 'Błąd serwera podczas operacji na rybach.'];
} catch (Exception $e) { // Inne błędy, np. z auth_middleware
    http_response_code(500); // Lub odpowiedni kod błędu z wyjątku
    $response = ['success' => false, 'message' => $e->getMessage()];
}

echo json_encode($response);
exit();
?>
