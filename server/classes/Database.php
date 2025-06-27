<?php
require_once __DIR__ . '/../config/config.php';

class Database
{
    private static $instance = null;
    private $pdo;

    private function __construct()
    {
        try {
            if (DB_TYPE === 'sqlite') {
                $dbDir = dirname(DB_PATH);
                if (!is_dir($dbDir)) {
                    mkdir($dbDir, 0755, true);
                }
                $this->pdo = new PDO('sqlite:' . DB_PATH);
                $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
                // Włącz obsługę kluczy obcych dla SQLite
                $this->pdo->exec('PRAGMA foreign_keys = ON;');
                $this->initSchema();
            }
        } catch (PDOException $e) {
            error_log("Błąd połączenia z bazą danych: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Błąd serwera: Nie można połączyć się z bazą danych.']);
            exit();
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection()
    {
        return $this->pdo;
    }

    private function initSchema()
    {
        $tables = [
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            "CREATE TABLE IF NOT EXISTS fish_species (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                image_path TEXT
            )",
            "CREATE TABLE IF NOT EXISTS fish (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                species_id INTEGER NOT NULL,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (species_id) REFERENCES fish_species(id) ON DELETE RESTRICT
            )",
            "CREATE TABLE IF NOT EXISTS user_aquarium_settings (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   user_id INTEGER UNIQUE NOT NULL,
                   light_status INTEGER DEFAULT 0,
                   last_fed_at DATETIME NULL,
                   last_cleaned_at DATETIME NULL,
                   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
               )",
            "CREATE TABLE IF NOT EXISTS available_decorations (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   name TEXT UNIQUE NOT NULL,
                   image_path TEXT NOT NULL,
                   default_width INTEGER DEFAULT 100,
                   default_height INTEGER DEFAULT 100
               )",
            "CREATE TABLE IF NOT EXISTS user_placed_decorations (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   user_id INTEGER NOT NULL,
                   decoration_id INTEGER NOT NULL,
                   pos_x INTEGER NOT NULL,
                   pos_y INTEGER NOT NULL,
                   width INTEGER NULL,
                   height INTEGER NULL,
                   rotation INTEGER DEFAULT 0,
                   z_index INTEGER DEFAULT 2,
                   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                   FOREIGN KEY (decoration_id) REFERENCES available_decorations(id) ON DELETE CASCADE
               )"
        ];

        foreach ($tables as $tableQuery) {
            $this->pdo->exec($tableQuery);
        }

        // Dodanie przykładowych dostępnych dekoracji, jeśli tabela jest pusta
        $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM available_decorations");
        $count = $stmt->fetchColumn();
        if ($count == 0) {
            $defaultDecorations = [
                ['name' => 'Pałka Wodna', 'image_path' => 'plant_1.png', 'default_width' => 100, 'default_height' => 180],
                ['name' => 'Szerokolistna Roślina Falista', 'image_path' => 'plant_2.png', 'default_width' => 130, 'default_height' => 160],
                ['name' => 'Wysoka Trawa Morska', 'image_path' => 'plant_3.png', 'default_width' => 90, 'default_height' => 170],
                ['name' => 'Niebieska Delikatna Roślina', 'image_path' => 'plant_5.png', 'default_width' => 80, 'default_height' => 150],
                ['name' => 'Fioletowy Koralowiec Rurkowy', 'image_path' => 'plant_6.png', 'default_width' => 120, 'default_height' => 140],
                ['name' => 'Turkusowa Gałązka', 'image_path' => 'plant_7.png', 'default_width' => 70, 'default_height' => 160],
                ['name' => 'Niska Zielona Trawa', 'image_path' => 'plant_8.png', 'default_width' => 180, 'default_height' => 70],
                ['name' => 'Płaski Kamień z Trawą', 'image_path' => 'plant_4.png', 'default_width' => 160, 'default_height' => 100],
                ['name' => 'Małe Otoczaki', 'image_path' => 'rock_1.png', 'default_width' => 150, 'default_height' => 50],
                ['name' => 'Grupa Dużych Kamieni', 'image_path' => 'rock_2.png', 'default_width' => 200, 'default_height' => 130],
            ];
            $insertStmt = $this->pdo->prepare("INSERT INTO available_decorations (name, image_path, default_width, default_height) VALUES (:name, :image_path, :default_width, :default_height)");
            foreach ($defaultDecorations as $deco) {
                $insertStmt->execute($deco);
            }
            error_log("Dodano domyślne dostępne dekoracje do bazy.");
        }

        // Dodanie przykładowych gatunków ryb, jeśli tabela jest pusta
        $stmt = $this->pdo->query("SELECT COUNT(*) as count FROM fish_species");
        $count = $stmt->fetchColumn();
        if ($count == 0) {
            $defaultSpecies = [
                ['name' => 'Gupik', 'image_path' => 'gupik.png'],
                ['name' => 'Neon Innesa', 'image_path' => 'neon_innesa.png'],
                ['name' => 'Bojownik', 'image_path' => 'bojownik.png'],
                ['name' => 'Skalar', 'image_path' => 'skalar.png'],
                ['name' => 'Danio Pręgowany', 'image_path' => 'danio_pregowany.png'],
                ['name' => 'Molinezja', 'image_path' => 'molinezja.png'],
            ];
            $insertStmt = $this->pdo->prepare("INSERT INTO fish_species (name, image_path) VALUES (:name, :image_path)");
            foreach ($defaultSpecies as $species) {
                $insertStmt->execute($species);
            }
            error_log("Dodano domyślne gatunki ryb do bazy.");
        }

        // Migracje: dodaj brakujące kolumny jeśli nie istnieją
        $cols = $this->pdo->query("PRAGMA table_info(user_aquarium_settings)")->fetchAll(PDO::FETCH_ASSOC);
        $colNames = array_column($cols, 'name');
        if (!in_array('hunger_level', $colNames)) {
            $this->pdo->exec("ALTER TABLE user_aquarium_settings ADD COLUMN hunger_level INTEGER DEFAULT 0");
        }
        if (!in_array('dirt_level', $colNames)) {
            $this->pdo->exec("ALTER TABLE user_aquarium_settings ADD COLUMN dirt_level INTEGER DEFAULT 0");
        }
        $colsFish = $this->pdo->query("PRAGMA table_info(fish)")->fetchAll(PDO::FETCH_ASSOC);
        $colNamesFish = array_column($colsFish, 'name');
        if (!in_array('weight', $colNamesFish)) {
            $this->pdo->exec("ALTER TABLE fish ADD COLUMN weight REAL");
        }
        if (!in_array('size', $colNamesFish)) {
            $this->pdo->exec("ALTER TABLE fish ADD COLUMN size REAL");
        }
        if (!in_array('description', $colNamesFish)) {
            $this->pdo->exec("ALTER TABLE fish ADD COLUMN description TEXT");
        }
    }
}
