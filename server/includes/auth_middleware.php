<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Firebase\JWT\BeforeValidException;

function authenticateUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

    if (!$authHeader) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Brak nagłówka autoryzacyjnego.']);
        exit();
    }

    list($type, $token) = explode(' ', $authHeader, 2);

    if (strcasecmp($type, 'Bearer') !== 0 || empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Nieprawidłowy format tokenu autoryzacyjnego. Oczekiwano "Bearer <token>".']);
        exit();
    }

    try {
        $decoded = JWT::decode($token, new Key(JWT_SECRET_KEY, JWT_ALGORITHM));
        return (array) $decoded->data;
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
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Nieprawidłowy token lub błąd autoryzacji: ' . $e->getMessage()]);
        error_log("JWT Decode Exception: " . $e->getMessage());
        exit();
    }
}
?>
