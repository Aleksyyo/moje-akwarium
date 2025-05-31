<?php
require_once __DIR__ . '/Database.php';
// Importowanie klas JWT
use Firebase\JWT\JWT;
use Firebase\JWT\Key; // Potrzebne dla nowszych wersji biblioteki

class User {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    // Metoda register bez zmian

    public function register($username, $password) {
        // ... (kod metody register bez zmian) ...
        if (empty($username) || empty($password)) {
            return ['success' => false, 'message' => 'Nazwa użytkownika i hasło są wymagane.'];
        }
        if (strlen($password) < 6) {
            return ['success' => false, 'message' => 'Hasło musi mieć co najmniej 6 znaków.'];
        }
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE username = :username");
        $stmt->execute(['username' => $username]);
        if ($stmt->fetch()) {
            return ['success' => false, 'message' => 'Użytkownik o tej nazwie już istnieje.'];
        }
        $hashedPassword = password_hash($password, PASSWORD_ARGON2ID);
        try {
            $stmt = $this->pdo->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
            $stmt->execute(['username' => $username, 'password' => $hashedPassword]);
            return ['success' => true, 'message' => 'Rejestracja zakończona pomyślnie. Możesz się teraz zalogować.'];
        } catch (PDOException $e) {
            error_log("Błąd rejestracji: " . $e->getMessage());
            return ['success' => false, 'message' => 'Błąd serwera podczas rejestracji. Spróbuj ponownie później.'];
        }
    }


    public function login($username, $password) {
        if (empty($username) || empty($password)) {
            return ['success' => false, 'message' => 'Nazwa użytkownika i hasło są wymagane.'];
        }

        $stmt = $this->pdo->prepare("SELECT id, username, password FROM users WHERE username = :username");
        $stmt->execute(['username' => $username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            unset($user['password']);

            // Generowanie tokenu JWT
            $issuedAt = time();
            $expirationTime = $issuedAt + JWT_EXPIRATION_TIME; // Token ważny przez 1 godzinę (z config)

            $payload = [
                'iss' => JWT_ISSUER,        // Kto wystawił token
                'aud' => JWT_AUDIENCE,      // Dla kogo jest token
                'iat' => $issuedAt,         // Kiedy został wystawiony (timestamp)
                'nbf' => $issuedAt,         // Nie przed (timestamp) - token ważny od teraz
                'exp' => $expirationTime,   // Kiedy wygasa (timestamp)
                'data' => [                 // Dane użytkownika w tokenie
                    'userId' => $user['id'],
                    'username' => $user['username']
                ]
            ];

            try {
                $jwt = JWT::encode($payload, JWT_SECRET_KEY, JWT_ALGORITHM);
                return [
                    'success' => true,
                    'message' => 'Logowanie pomyślne.',
                    'token' => $jwt,
                    'user' => [ // Zwracamy też podstawowe info o userze dla frontendu
                        'id' => $user['id'],
                        'username' => $user['username']
                    ],
                    'expiresIn' => JWT_EXPIRATION_TIME
                ];
            } catch (Exception $e) {
                error_log("Błąd generowania JWT: " . $e->getMessage());
                return ['success' => false, 'message' => 'Błąd serwera podczas generowania tokenu.'];
            }
        } else {
            return ['success' => false, 'message' => 'Nieprawidłowa nazwa użytkownika lub hasło.'];
        }
    }
}
?>
