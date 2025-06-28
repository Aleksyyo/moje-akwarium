<?php
require_once __DIR__ . '/Database.php';
// Importowanie klas JWT
use Firebase\JWT\JWT;
use Firebase\JWT\Key; 

class User {
    private $pdo;

    public function __construct() {
        $this->pdo = Database::getInstance()->getConnection();
    }

    public function register($username, $password) {
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
            $expirationTime = $issuedAt + JWT_EXPIRATION_TIME;
            $payload = [
                'iss' => JWT_ISSUER,
                'aud' => JWT_AUDIENCE,
                'iat' => $issuedAt,
                'nbf' => $issuedAt,
                'exp' => $expirationTime,
                'data' => [
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
                    'user' => [
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
