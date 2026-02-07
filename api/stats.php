<?php
// api/stats.php - Prosty backend do obsługi statystyk w pliku JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

$file = '../stats.json';

// Inicjalizacja pliku jeśli nie istnieje
if (!file_exists($file)) {
    $initialData = [
        'totalGames' => 0,
        'totalCorrect' => 0,
        'totalQuestions' => 0,
        'bestScores' => [
            'easy' => 0,
            'medium' => 0,
            'hard' => 0
        ],
        'recentGames' => []
    ];
    file_put_contents($file, json_encode($initialData));
}

// Obsługa GET - pobieranie statystyk
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        echo json_encode(['error' => 'Stats file not found']);
    }
    exit;
}

// Obsługa POST - aktualizacja statystyk
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    // Sprawdzenie uprawnień
    if (file_exists($file) && !is_writable($file)) {
        http_response_code(500);
        echo json_encode(['error' => 'Server permission denied: stats.json is not writable']);
        exit;
    }

    // Blokada pliku dla bezpieczeństwa przy równoczesnych zapisach
    $fp = fopen($file, 'c+');
    if (flock($fp, LOCK_EX)) {
        $filesize = filesize($file);
        $currentData = $filesize > 0 ? json_decode(fread($fp, $filesize), true) : null;

        if (!$currentData) {
            $currentData = [
                'totalGames' => 0,
                'totalCorrect' => 0,
                'totalQuestions' => 0,
                'bestScores' => [
                    'easy' => 0,
                    'medium' => 0,
                    'hard' => 0
                ],
                'recentGames' => []
            ];
        }

        // Aktualizacja danych ogólnych
        $currentData['totalGames']++;
        $currentData['totalCorrect'] += (int) $input['score'];
        $currentData['totalQuestions'] += (int) $input['total'];

        // Aktualizacja liczników wg poziomu trudności
        $difficulty = $input['difficulty'];
        if (!isset($currentData['gamesModes'])) {
            $currentData['gamesModes'] = ['easy' => 0, 'medium' => 0, 'hard' => 0];
        }
        if (!isset($currentData['gamesModes'][$difficulty])) {
            $currentData['gamesModes'][$difficulty] = 0;
        }
        $currentData['gamesModes'][$difficulty]++;

        // Sprawdzenie rekordu
        $difficulty = $input['difficulty'];
        if (isset($currentData['bestScores'][$difficulty])) {
            if ($input['score'] > $currentData['bestScores'][$difficulty]) {
                $currentData['bestScores'][$difficulty] = (int) $input['score'];
            }
        }

        // Dodanie gry do historii (ostatnie 50)
        if (!isset($currentData['recentGames'])) {
            $currentData['recentGames'] = [];
        }

        $newGame = [
            'playerName' => htmlspecialchars($input['playerName'] ?? 'Anonim'), // Sanitize input
            'score' => (int) $input['score'],
            'total' => (int) $input['total'],
            'difficulty' => $input['difficulty'],
            'date' => date('c') // ISO 8601 date
        ];

        // Dodaj na początek tablicy
        array_unshift($currentData['recentGames'], $newGame);

        // Zachowaj tylko 50 ostatnich gier
        if (count($currentData['recentGames']) > 50) {
            $currentData['recentGames'] = array_slice($currentData['recentGames'], 0, 50);
        }

        // Zapis
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($currentData));
        fflush($fp);
        flock($fp, LOCK_UN);

        echo json_encode(['success' => true, 'data' => $currentData]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Could not lock file']);
    }
    fclose($fp);
    exit;
}
?>