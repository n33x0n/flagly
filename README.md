# Flagly - Aplikacja do nauki flag 🏳️

To jest wersja produkcyjna (zbudowana) aplikacji Flagly - interaktywnego quizu do nauki flag państw świata.

## Ostatnia aktualizacja (v1.0.2 - Global Stats Redesign)

- **Ekran statystyk ogólnych**: Całkowita przebudowa widoku.
  - **Rząd 1**: Liczba gier (Łącznie, Easy, Medium, Hard).
  - **Rząd 2**: Rekordy punktowe (Max, Easy, Medium, Hard).
  - **Rząd 3**: Trafność (Poprawne, Błędne, Średnia %).
- **Responsywność**: Grid 4-kolumnowy na desktopie, lista na mobile.

## Funkcje

- 3 poziomy trudności (Łatwy, Średni, Trudny)
- 254 kraje obsługiwane przez API flagcdn.com
- Statystyki gracza i historia gier (Local Storage)
- **Globalne statystyki** (Leaderboard + Detailed Metrics)
- **Liczniki społecznościowe** - sumaryczna liczba gier per poziom
- Responsywny design (Mobile First)

## Wymagania serwera i Troubleshooting

Dla pełnej funkcjonalności (Statystyki Ogólne + Liczniki) serwer musi obsługiwać PHP.

### Problem: "Błąd zapisu online" / Liczniki stoją w miejscu

**Rozwiązanie:** Nadaj uprawnienia do zapisu dla pliku `stats.json`:

```bash
chmod 666 stats.json
```

## Jak zaktualizować (dla administratora)

```bash
cd flagly
git fetch origin
git reset --hard origin/main
chmod 666 stats.json
```

---
© 2026 Tomasz Lebioda
