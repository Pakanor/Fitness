# FitnessApp — Dokumentacja funkcji ćwiczeniowych (analityka, PR, objętość, streaks)

Poniższy opis zestawia wszystkie funkcje i opcje modułu ćwiczeniowego (`ExerciseAPI` + frontend `src/features/exercises`, `src/pages/RecordsPage`, `ExerciseHub`). Skupia się na "dodatkowych rzeczach" poza samym logowaniem serii: liczeniu PR, objętości, e1RM, streakach i analizach.

---

## 1. Sesje treningowe i ćwiczenia (baza danych)

### Modele (`backend/ExerciseAPI/Models/`)
- **`WorkoutSession`** — jedna sesja na dany dzień. Statusy: `Planned` (zaplanowana), `InProgress` (w trakcie), `Completed` (ukończona). Tylko sesje `InProgress`/`Completed` liczą się do statystyk (objętości, streaków, rekordów); `Planned` to tylko plan i nie wchodzi w analitykę. Pola: `TotalVolume` (kg), `StartedAt`, `CompletedAt`, `TemplateId`, `StartMode`.
- **`WorkoutStartMode`** — sposób rozpoczęcia sesji: `Manual`, `FromTemplate`, `CopyPrevious`.
- **`UserExercise`** — ćwiczenie przypisane do użytkownika w danej dacie, opcjonalnie powiązane z sesją (`SessionId`) i szablonem (`TemplateId`). Zawiera kolekcję `Sets`.
- **`WorkoutSet`** — pojedyncza seria: `SetNumber`, `Weight` (kg), `Reps`, `RPE` (opcjonalnie, 1–10), `IsWarmup`.
- **`Exercise`** — baza ćwiczeń z nazwą, kategorią, opisem, URL GIF-a, flagą `IsBenchmark` oraz mapowaniem partii mięśniowych (21 mięśni z wagami %, np. klatka, barki, trójgłowy, plecy, nogi, pośladki, łydki, brzuch).
- **`PersonalRecord`** — rekord osobisty: `UserId`, `ExerciseId`, `Weight`, `Reps`, `Date`, dodatkowo `UserWeightAtTime`, `UserAgeAtTime`, `DietStatusAtTime`, `StrengthToWeightRatio`.

### Kluczowa reguła statystyczna
`RecordsService.CountsTowardsStats`: sesje `Planned` nigdy nie dochodzą do objętości, streaków ani rekordów. Wiersze legacy bez sesji (`SessionId == null`) zawsze zählen się.

---

## 2. Rekordsy osobiste (PR) — `RecordsController` / `RecordsService`

### Endpointy (`api/records`)
| Endpoint | Opis |
|---|---|
| `GET /api/records/history` | Wszystkie PR użytkownika z dołączeniem nazwy/kategorii ćwiczenia, posortowane malejąco po wadze. |
| `GET /api/records/exercise/{exerciseId}` | Historia PR dla konkretnego ćwiczenia (data, waga, reps, kontekst ciała/diety). |
| `GET /api/records/search?q=` | Wyszukiwanie ćwiczeń (ILike) z flagą `HasPR` — czy użytkownik ma już rekord dla danego ćwiczenia. |
| `GET /api/records/1rm-progression` | Progresja 1RM dla ćwiczeń benchmarkowych. |
| `GET /api/records/exercise/{id}/progress` | Szczegółowa progresja ćwiczenia (e1RM, tonaż, PR, partie mięśniowe). |
| `GET /api/records/overview` | Globalna analityka (partie mięśniowe, aktywność, trend tygodniowy) z zakresem dat i strefą czasową. |

### Co liczy się jako PR
- Najcięższa zalogowana seria (waga × reps) z wszystkich sesji nie-planowych.
- W `ExerciseProgressResponseDto` eksponowane: `AllTimePrWeight`, `AllTimePrReps`, `AllTimeMaxE1RM`, `TotalSets`, `LastPerformedDate`.

---

## 3. e1RM — szacowana jednokrotna maksymalna (`E1RMCalculator`)

### Wzór
- **Epley:** `weight × (1 + effectiveReps / 30)`, gdzie `effectiveReps = reps + (10 − RPE)` gdy RPE podane — używane wszędzie: progresja 1RM, progresja ćwiczenia, all-time best, hard sets, plateau.
- `IsValidSet`: waga ≥ 0 i reps > 0.

### Ćwiczenia benchmarkowe (`RecordsService.MainCompoundLifts`)
Przysiad, wyciskanie sztangi (leżąc), martwy ciąg, wyciskanie nad głowę (i polskie nazwy). Tylko dla nich budowana jest progresja 1RM (`OneRepMaxProgressionResponseDto` z `Current1RM` i historią `OneRepMaxDataPointDto` po dacie).

### Co pokazuje frontend
- **`E1RMProgressChart`** — wykres linii e1RM i top set w czasie, KPI: All-Time PR (kg × reps), najlepsze e1RM, wykonane serie, data ostatniego wykonania.
- **`ExerciseProgressChart`** (dialog) — to samo w oknie modalnym z poziomu historii treningów (chip "1RM" przy ćwiczeniu dnia).

---

## 4. Objętość treningowa (volume / tonaż)

### Objętość sesji
`WorkoutSession.TotalVolume = Σ(sets × reps × weight)` po ćwiczeniach mających wszystkie trzy wartości. Wyświetlana w banerze sesji (`WorkoutDashboard.SessionBanner`) jako "X kg objętości" po ukończeniu.

### Objętość efektywna — "hard sets"
`RecordsService.IsHardSet`: seria nie jest warm-upem **oraz** waga ≥ 50% najlepszego e1RM danego ćwiczenia. Hard sets są podstawą większości analiz (nie liczą się série rozruchowe).

### Analizy objętości (`GlobalAnalyticsResponseDto` / `ExerciseProgressResponseDto`)
1. **Objętość per partia mięśniowa** — hard sets na tydzień (średnia w okresie), wykres słupkowy w `TrainingOverview` ("Średnia objętość efektywna wg partii"). Mapowanie 21 mięśni z `Exercise.GetMuscleWeights`.
2. **Tonaż per sesja** — `weight × reps` zsumowane na dzień, wykres słupkowy + średnie powtórzenia jako linia (`ExerciseWorkloadPointDto`).
3. **Dystans rep-range'ów** — kategorie 1–5, 6–10, 11–15 powtórzeń z liczbą serii.
4. **Tygodniowy trend** — hard sets + średnie RPE w tygodniu (`WeeklyTrainingTrendDto`).

---

## 5. Streaks i aktywność treningowa

### Mapa aktywności (heatmap)
`TrainingActivityDayDto` — data + liczba hard sets w danym dniu. Renderowane w `TrainingOverview` jako siatka 7 dni × tygodnie z 4 poziomami nasycenia koloru (0–3): brak, mało, średnio, dużo. Tooltip z datą i liczbą serii.

### Historia treningów (`TrainingHistoryPage`)
- Ostatnie 60 dni, dni z zalogowanymi ćwiczeniami, klikalny dzień → przejście do edycji sesji (`/exercise-start?date=...`).
- Przy każdym dniu lista unikalnych ćwiczeń jako chipy z odnośnikiem "1RM" otwierającym wykres progresji ćwiczenia.

---

## 6. Opcje zakresów dat i strefy czasowej

Frontend `RecordsPage` pasek narzędzi (`analytics-toolbar`):
- Zakresy presetów: **Tydzień, 1M, 3M, 6M, ALL, Własny zakres (CUSTOM)**.
- Dla CUSTOM: dwa selektory dat (początek / koniec).
- Zakres przekazywany do `getTrainingOverview` i `getExerciseProgress` jako `startDate`/`endDate`.

Backend `RecordsService.GetOverview` akceptuje opcjonalny parametr **`timeZone`** — konwertuje daty użytkownika na UTC przed filtrowaniem (obsługa błędnej/nieznanej strefy → fallback UTC). Frontend przesyła `Intl.DateTimeFormat().resolvedOptions().timeZone`.

---

## 7. Szablony treningów (`TemplateController`, `TemplateService`)

- Tworzenie/edycja szablonów ćwiczeń (`CreateTemplateDto`, `UpdateTemplateDto`, `TemplateResponseDto`, `TemplateExercise`).
- Ładowanie szablonu na wybrany dzień (`workoutAPI.loadTemplate`).
- **Kopiowanie poprzedniego treningu szablonu** (`templateAPI.copyPreviousByTemplate`) — wzór wagi/reps z ostatniego wykonania tego szablonu.
- Podpowiedź "Poprzednio: X kg × Y powt." na karcie ćwiczenia w `WorkoutDashboard` (`prevMap` z `getPreviousByTemplate`).

---

## 8. Przebieg treningu (statusy sesji)

`WorkoutDashboard` / `SESSION_STATUS`:
- **Planned** — "Zaplanowany": serie zapisuje się po rozpoczęciu treningu.
- **In Progress** — "W trakcie": kliknij ćwiczenie, aby zapisać serie.
- **Completed** — "Ukończony": dane uzupełnione, można edytować; wyświetla objętość sesji.

Blokada edycji: sesja `Planned` zablokowana, jeśli data w przyszłości i nie można jej wypełnić; `Completed` można edytować ponownie (`CanReopen`).

---

## 9. Eksploracja i baza ćwiczeń

- Import ćwiczeń z pliku CSV (`exercise-everything.csv`) przez `ExerciseDbImportService` / `ExerciseStartupSeeder` przy starcie.
- GIF-y animacyjne ćwiczeń w `wwwroot/gifs/` (wyświetlane na karcie ćwiczenia i w dashboardzie).
- Wyszukiwanie po nazwie/kategorii, paginacja (strony po 40), lista "najczęściej wykonywanych" w `RecordsPage`.

---

## 10. Inne funkcje powiązane (poza ćwiczeniami, wspomniane dla kontekstu)

- **AuthAPI**: rejestracja, login z weryfikacją e-mail, reset hasła, profil, eksport danych JSON, zmiana hasła, usuwanie konta, sesje urządzeń (list/revoke z device/browser/os/IP).
- **BackendLogicApi**: kalkulator kalorii (BMR/TDEE), operacje na produktach spożywczych, śledzenie kalorii (`CalorieTracer`).
- **AuthAPI**: pomiary ciała (`BodyMeasurement`), dokumentacja płatności/ustawień konta.

---

## Pliki kluczowe

Backend:
- `backend/ExerciseAPI/Models/PersonalRecord.cs` — rekordy PR
- `backend/ExerciseAPI/Models/WorkoutSession.cs` — sesje i objętość
- `backend/ExerciseAPI/Models/WorkoutSet.cs` — serie (waga, reps, RPE, warmup)
- `backend/ExerciseAPI/Models/Exercise.cs` — baza ćwiczeń + partie mięśniowe + benchmark
- `backend/ExerciseAPI/Services/RecordsService.cs` — logika PR, e1RM, objętości, hard sets, streaks, analityka
- `backend/ExerciseAPI/Services/E1RMCalculator.cs` — jedyny wzór e1RM (Epley z RPE)
- `backend/ExerciseAPI/Controllers/RecordsController.cs` — endpointy analityki

Frontend:
- `frontend/src/pages/RecordsPage.jsx` — główna analityka treningowa (zakresy, widoki)
- `frontend/src/features/exercises/TrainingOverview.jsx` — partie mięśniowe, heatmap aktywności, trend tygodniowy
- `frontend/src/features/exercises/E1RMProgressChart.jsx` — wykres i KPI e1RM/PR
- `frontend/src/features/exercises/ExerciseProgressChart.jsx` — dialog progresji ćwiczenia
- `frontend/src/features/exercises/TrainingHistoryPage.jsx` — historia ostatnich 60 dni
- `frontend/src/features/exercises/Workoutdashboard.jsx` — sesja dzisiaj, statusy, podpowiedź poprzedniego wyniku
- `frontend/src/api/exerciseAPI.jsx` — warstwa API (`getExerciseProgress`, `getTrainingOverview`, `getRecordsByExercise`)
