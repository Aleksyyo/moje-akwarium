<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/config/config.php'; 

echo "Próba połączenia z bazą danych SQLite w: " . DB_PATH . "<br>";

$dbDir = dirname(DB_PATH);
echo "Katalog bazy danych: " . $dbDir . "<br>";

if (!is_dir($dbDir)) {
    echo "Katalog bazy danych nie istnieje. Próba utworzenia...<br>";
    if (mkdir($dbDir, 0775, true)) { 
        echo "Katalog bazy danych utworzony pomyślnie.<br>";
    } else {
        echo "BŁĄD: Nie udało się utworzyć katalogu bazy danych. Sprawdź uprawnienia.<br>";
        if (!is_dir($dbDir)) {
            exit("Zakończono z powodu błędu tworzenia katalogu.");
        }
    }
} else {
    echo "Katalog bazy danych już istnieje.<br>";
}


if (is_writable($dbDir)) {
    echo "Katalog bazy danych jest zapisywalny.<br>";
} else {
    echo "BŁĄD: Katalog bazy danych NIE JEST zapisywalny. Sprawdź uprawnienia.<br>";
}


if (file_exists(DB_PATH)) {
    if (is_writable(DB_PATH)) {
        echo "Plik bazy danych jest zapisywalny.<br>";
    } else {
        echo "BŁĄD: Plik bazy danych ISTNIEJE, ale NIE JEST zapisywalny.<br>";
    }
}


try {
    $pdo = new PDO('sqlite:' . DB_PATH);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Połączenie z bazą danych SQLite nawiązane pomyślnie!<br>";

    $pdo->exec("CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT)");
    echo "Tabela 'test_table' sprawdzona/utworzona pomyślnie.<br>";



} catch (PDOException $e) {
    echo "BŁĄD PDOException: Nie udało się połączyć z bazą danych lub wykonać zapytania: " . $e->getMessage() . "<br>";
} catch (Exception $e) {
    echo "BŁĄD Exception: " . $e->getMessage() . "<br>";
}
?>
