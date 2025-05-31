<?php
// dev_router.php
// Ten router jest przeznaczony do użytku z wbudowanym serwerem PHP:
// php -S localhost:8000 -t public dev_router.php

$requestedPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Jeśli żądanie jest do API (zaczyna się od /api/)
if (preg_match('/^\/api\//', $requestedPath)) {
    // Zmień ścieżkę, aby wskazywała na pliki w katalogu server/
    // np. /api/auth.php -> ../server/api/auth.php
    // Ważne: serwer PHP musi być uruchomiony z document root ustawionym na 'public'
    // a ten router musi być w katalogu nadrzędnym do 'public'
    // lub musimy odpowiednio dostosować ścieżki.

    // Załóżmy, że ten router jest w głównym katalogu projektu,
    // a serwer jest uruchomiony z -t public
    // Wtedy ścieżka do pliku API będzie: __DIR__ . '/server' . $requestedPath
    // np. /moje-akwarium/server/api/species.php

    // Poprawka: Jeśli serwer jest uruchomiony z `php -S localhost:8000 -t public dev_router.php`
    // to `$_SERVER['SCRIPT_FILENAME']` dla żądania do `/api/species.php`
    // będzie wskazywać na `public/api/species.php` (którego nie ma).
    // Musimy przekierować wykonanie do pliku w `server/`

    error_log("Router: Requested API path: " . $requestedPath);
    $apiFile = __DIR__ . '/server' . $requestedPath; // np. /path/to/moje-akwarium/server/api/species.php
    error_log("Router: Trying API file: " . $apiFile);

    if (file_exists($apiFile) && is_file($apiFile)) {
        // Ustaw odpowiedni katalog roboczy, aby include/require działały poprawnie w skryptach API
        chdir(dirname($apiFile)); // Zmień katalog roboczy na np. /path/to/moje-akwarium/server/api/
        require $apiFile; // Wykonaj skrypt API
        return true; // Zakończ przetwarzanie przez router
    } else {
        // Jeśli plik API nie istnieje, zwróć 404
        http_response_code(404);
        echo json_encode(['error' => 'API endpoint not found', 'requested' => $requestedPath, 'tried_file' => $apiFile]);
        return true;
    }
}

// Dla wszystkich innych żądań, pozwól wbudowanemu serwerowi obsłużyć je jako pliki statyczne
// Jeśli plik istnieje w public/, zostanie obsłużony.
// Jeśli nie, serwer zwróci 404 (lub obsłuży index.html, jeśli to katalog).
// To jest domyślne zachowanie, gdy router zwraca false.
return false;
?>
