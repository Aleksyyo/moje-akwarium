<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth_middleware.php';
require_once __DIR__ . '/../classes/Database.php';

header('Content-Type: application/json');

// Autoryzacja użytkownika (jeśli endpoint nie jest publiczny)
$userData = authenticateUser();
$userId = $userData['userId'] ?? null;

$response = ['success' => false, 'message' => 'Nieznana operacja na dekoracjach.'];
$method = $_SERVER['REQUEST_METHOD'];
$type = $_GET['type'] ?? null;
$userDecorationId = $_GET['user_decoration_id'] ?? null;

try {
    $pdo = Database::getInstance()->getConnection();

    if ($method === 'GET') {
        if ($type === 'available') {
            // Pobierz wszystkie dostępne dekoracje
            $stmt = $pdo->query("SELECT id, name, image_path, default_width, default_height FROM available_decorations ORDER BY name ASC");
            $availableDecorations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $response = ['success' => true, 'decorations' => $availableDecorations];
            http_response_code(200);
        } elseif ($type === 'user' && $userId) {
            // Pobierz dekoracje użytkownika
            $stmt = $pdo->prepare("
                SELECT upd.id as user_placed_id, upd.pos_x, upd.pos_y, upd.width, upd.height, upd.rotation, upd.z_index,
                       ad.id as decoration_template_id, ad.name, ad.image_path, ad.default_width, ad.default_height
                FROM user_placed_decorations upd
                JOIN available_decorations ad ON upd.decoration_id = ad.id
                WHERE upd.user_id = :user_id
            ");
            $stmt->execute(['user_id' => $userId]);
            $userDecorations = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $response = ['success' => true, 'decorations' => $userDecorations];
            http_response_code(200);
        } else {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'Nieprawidłowy typ żądania GET lub brak autoryzacji.'];
        }
    } elseif ($method === 'POST' && $type === 'user' && $userId) {
        $input = json_decode(file_get_contents('php://input'), true);
        $decorationId = $input['decoration_id'] ?? null;
        $posX = $input['pos_x'] ?? 0;
        $posY = $input['pos_y'] ?? 0;
        $width = $input['width'] ?? null;
        $height = $input['height'] ?? null;
        $rotation = $input['rotation'] ?? 0;
        $zIndex = $input['z_index'] ?? 2;
        $userPlacedIdToUpdate = $input['user_placed_id'] ?? null;

        if (!$decorationId) {
            http_response_code(400);
            $response = ['success' => false, 'message' => 'ID dekoracji (decoration_id) jest wymagane.'];
        } else {
            // Walidacja: sprawdź, czy decoration_id istnieje
            $checkStmt = $pdo->prepare("SELECT id FROM available_decorations WHERE id = :id");
            $checkStmt->execute(['id' => $decorationId]);
            if (!$checkStmt->fetch()) {
                http_response_code(400);
                $response = ['success' => false, 'message' => 'Wybrany szablon dekoracji nie istnieje.'];
            } else {
                if ($userPlacedIdToUpdate) {
                    $sql = "UPDATE user_placed_decorations SET decoration_id = :decoration_id, pos_x = :pos_x, pos_y = :pos_y, width = :width, height = :height, rotation = :rotation, z_index = :z_index
                            WHERE id = :user_placed_id AND user_id = :user_id";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([
                        'decoration_id' => $decorationId, 'pos_x' => $posX, 'pos_y' => $posY,
                        'width' => $width, 'height' => $height, 'rotation' => $rotation, 'z_index' => $zIndex,
                        'user_placed_id' => $userPlacedIdToUpdate, 'user_id' => $userId
                    ]);
                    $message = 'Dekoracja zaktualizowana.';
                    $newId = $userPlacedIdToUpdate;
                } else {
                    $sql = "INSERT INTO user_placed_decorations (user_id, decoration_id, pos_x, pos_y, width, height, rotation, z_index)
                            VALUES (:user_id, :decoration_id, :pos_x, :pos_y, :width, :height, :rotation, :z_index)";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([
                        'user_id' => $userId, 'decoration_id' => $decorationId, 'pos_x' => $posX, 'pos_y' => $posY,
                        'width' => $width, 'height' => $height, 'rotation' => $rotation, 'z_index' => $zIndex
                    ]);
                    $newId = $pdo->lastInsertId();
                    $message = 'Dekoracja dodana.';
                }
                // Pobierz zaktualizowaną/dodaną dekorację
                $fetchStmt = $pdo->prepare("
                    SELECT upd.id as user_placed_id, upd.pos_x, upd.pos_y, upd.width, upd.height, upd.rotation, upd.z_index,
                           ad.id as decoration_template_id, ad.name, ad.image_path, ad.default_width, ad.default_height
                    FROM user_placed_decorations upd
                    JOIN available_decorations ad ON upd.decoration_id = ad.id
                    WHERE upd.id = :id AND upd.user_id = :user_id
                ");
                $fetchStmt->execute(['id' => $newId, 'user_id' => $userId]);
                $savedDecoration = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                $response = ['success' => true, 'message' => $message, 'decoration' => $savedDecoration];
                http_response_code($userPlacedIdToUpdate ? 200 : 201);
            }
        }
    } elseif ($method === 'DELETE' && $type === 'user' && isset($_GET['all']) && $_GET['all'] === 'true' && $userId) {
        // Usuwanie wszystkich dekoracji użytkownika
        $stmt = $pdo->prepare("DELETE FROM user_placed_decorations WHERE user_id = :user_id");
        $stmt->execute(['user_id' => $userId]);
        $response = ['success' => true, 'message' => 'Wszystkie dekoracje zostały usunięte.'];
        http_response_code(200);
    } elseif ($method === 'DELETE' && $type === 'user' && $userDecorationId && $userId) {
        $stmt = $pdo->prepare("DELETE FROM user_placed_decorations WHERE id = :id AND user_id = :user_id");
        $stmt->execute(['id' => $userDecorationId, 'user_id' => $userId]);

        if ($stmt->rowCount() > 0) {
            $response = ['success' => true, 'message' => 'Dekoracja usunięta pomyślnie.'];
            http_response_code(200);
        } else {
            http_response_code(404);
            $response = ['success' => false, 'message' => 'Nie znaleziono dekoracji do usunięcia lub brak uprawnień.'];
        }
    } else {
        http_response_code(405);
        $response = ['success' => false, 'message' => 'Niedozwolona metoda lub nieprawidłowe parametry.'];
    }

} catch (PDOException $e) {
    error_log("Błąd API decorations (PDOException): " . $e->getMessage() . " w pliku " . $e->getFile() . " linia " . $e->getLine());
    http_response_code(500);
    $response = ['success' => false, 'message' => 'Błąd serwera podczas operacji na dekoracjach (PDO).'];
} catch (Exception $e) {
    error_log("Błąd API decorations (Exception): " . $e->getMessage() . " w pliku " . $e->getFile() . " linia " . $e->getLine());
    http_response_code(500);
    $response = ['success' => false, 'message' => 'Błąd serwera: ' . $e->getMessage()];
}

echo json_encode($response);
exit();
?>
