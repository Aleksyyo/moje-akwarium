<?php
// Ten plik powinien być dołączany na początku chronionych endpointów API
// require_once __DIR__ . '/../config/config.php'; // config.php jest już dołączony w pliku endpointu
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Firebase\JWT\BeforeValidException;

function authenticateUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

    if (!$authHeader) {
        http_response_code(401); // Unauthorized
        echo json_encode(['success' => false, 'message' => 'Brak nagłówka autoryzacyjnego.']);
        exit();
    }

    // Oczekujemy formatu "Bearer <token>"
    list($type, $token) = explode(' ', $authHeader, 2);

    if (strcasecmp($type, 'Bearer') !== 0 || empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Nieprawidłowy format tokenu autoryzacyjnego. Oczekiwano "Bearer <token>".']);
        exit();
    }

    try {
        // Dekodowanie i weryfikacja tokenu
        // Dla nowszych wersji firebase/php-jwt, klucz musi być obiektem Key
        $decoded = JWT::decode($token, new Key(JWT_SECRET_KEY, JWT_ALGORITHM));
        
        // Token jest ważny, zwracamy zdekodowane dane (payload)
        // Możemy chcieć zwrócić tylko część 'data' z payloadu
        return (array) $decoded->data; // Zwracamy dane użytkownika z tokenu
    } catch (ExpiredException $e) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token wygasł. Zaloguj się ponownie.']);
        error_log("Expired token: " . $e->getMessage());
        exit();
    } catch (SignatureInvalidException $e) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Nieprawidłowy podpis tokenu.']);
        error_log("Invalid signature: " . $e->getMessage());
        exit();
    } catch (BeforeValidException $e) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token jeszcze nie jest ważny.']);
        error_log("Token not yet valid: " . $e->getMessage());
        exit();
    } catch (Exception $e) { // Inne błędy JWT lub ogólne
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Nieprawidłowy token lub błąd autoryzacji: ' . $e->getMessage()]);
        error_log("JWT Decode Exception: " . $e->getMessage());
        exit();
    }
}
?>
