# Dokumentacja Frontend - Moje Akwarium

## Struktura Plików Frontendu (w katalogu `public/`)

-   `index.html`: Główna strona aplikacji (logowanie, rejestracja, dashboard akwarium).
-   `gallery.html`: Podstrona z galerią ryb użytkownika.
-   `css/style.css`: Główny arkusz stylów dla całej aplikacji.
-   `js/app.js`: Główny skrypt JavaScript dla `index.html` (logika UI, interakcje, komunikacja z API dla akwarium).
-   `js/gallery.js`: Skrypt JavaScript dla `gallery.html` (ładowanie i wyświetlanie ryb w galerii).
-   `assets/`: Katalog zawierający zasoby statyczne:
    -   `images/aquarium_elements/`: Obrazki tła akwarium, dekoracji.
    -   `images/aquarium_effects/`: Obrazki dla animacji (jedzenie, czyszczenie).
    -   `images/fish_icons/`: Obrazki poszczególnych gatunków ryb.

## Główne Funkcjonalności Zaimplementowane w Froncie

-   **Interfejs Użytkownika:**
    -   Formularze logowania i rejestracji.
    -   Dashboard akwarium z kontrolkami akcji.
    -   Graficzna reprezentacja akwarium z rybami i dekoracjami.
    -   Panel wyboru tła akwarium.
    -   Panel/modal do dodawania ryb.
    -   Panel/modal do wyboru i dodawania dekoracji.
    -   Podstrona galerii ryb.
-   **Logika Po Stronie Klienta:**
    -   Obsługa zdarzeń (kliknięcia przycisków, zmiany w formularzach).
    -   Dynamiczna aktualizacja DOM (dodawanie/usuwanie ryb, dekoracji, zmiana wyglądu).
    -   Animacje (pływające ryby, karmienie, czyszczenie).
    -   Przechowywanie tokenu JWT i danych użytkownika w `localStorage`.
    -   Zarządzanie stanem zalogowania i odpowiednie wyświetlanie/ukrywanie sekcji.
    -   Podstawowa walidacja danych wejściowych w formularzach.
-   **Komunikacja z API Backendu:**
    -   Wysyłanie żądań do endpointów API (rejestracja, logowanie, pobieranie/dodawanie/usuwanie ryb, pobieranie/dodawanie/usuwanie dekoracji, pobieranie/zmiana ustawień akwarium).
    -   Obsługa odpowiedzi z API i wyświetlanie komunikatów.
    -   Dołączanie tokenu JWT do autoryzowanych żądań.

## Użyte Biblioteki/Frameworki (Frontend)

-   Na chwilę obecną: Czysty JavaScript (Vanilla JS), HTML, CSS.
-   Nie użyto zewnętrznych bibliotek JS (np. jQuery, React, Vue), ale można je zintegrować w przyszłości.

## Responsywność (RWD)

-   Strona główna (`index.html`) i podstrona galerii (`gallery.html`) posiadają podstawowe wsparcie dla RWD, dostosowując układ i rozmiary elementów do różnych szerokości ekranu (desktop, tablet, mobile).
-   Użyto głównie CSS Grid, Flexbox oraz Media Queries.

## Dalszy Rozwój (Frontend)

-   Bardziej zaawansowane animacje ryb i interakcje.
-   Implementacja drag & drop dla pozycjonowania dekoracji.
-   Narzędzia do zmiany rozmiaru i rotacji dekoracji.
-   Lepsza obsługa błędów i komunikatów dla użytkownika.
-   Możliwość refaktoryzacji kodu do modułów ES6 dla lepszej organizacji.
-   Testy jednostkowe lub E2E dla kluczowych funkcjonalności.
