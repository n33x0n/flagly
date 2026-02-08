// Zarządzanie statystykami w localStorage

export interface GameResult {
    date: string;
    score: number;
    total: number;
    difficulty: string;
    timeSeconds: number;
}

export interface PlayerStats {
    gamesPlayed: number;
    bestScore: number;
    totalCorrect: number;
    totalQuestions: number;
    history: GameResult[];
}

export interface StorageData {
    players: Record<string, PlayerStats>;
    lastPlayer: string | null;
}

const STORAGE_KEY = 'flagly_stats';

function getStorage(): StorageData {
    if (typeof window === 'undefined') {
        return { players: {}, lastPlayer: null };
    }

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error reading localStorage:', e);
    }

    return { players: {}, lastPlayer: null };
}

function saveStorage(data: StorageData): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

export function saveGameResult(playerName: string, result: Omit<GameResult, 'date'>): void {
    const storage = getStorage();

    if (!storage.players[playerName]) {
        storage.players[playerName] = {
            gamesPlayed: 0,
            bestScore: 0,
            totalCorrect: 0,
            totalQuestions: 0,
            history: []
        };
    }

    const player = storage.players[playerName];
    const gameResult: GameResult = {
        ...result,
        date: new Date().toISOString()
    };

    player.gamesPlayed++;
    player.totalCorrect += result.score;
    player.totalQuestions += result.total;
    player.bestScore = Math.max(player.bestScore, result.score);
    player.history.unshift(gameResult);

    // Zachowaj tylko ostatnie 50 gier
    if (player.history.length > 50) {
        player.history = player.history.slice(0, 50);
    }

    storage.lastPlayer = playerName;
    saveStorage(storage);
}

export function getPlayerStats(playerName: string): PlayerStats | null {
    const storage = getStorage();
    return storage.players[playerName] || null;
}

export function getLastPlayer(): string | null {
    const storage = getStorage();
    return storage.lastPlayer;
}

export function getAllPlayers(): string[] {
    const storage = getStorage();
    return Object.keys(storage.players);
}

export function getLeaderboard(): Array<{ name: string; bestScore: number; gamesPlayed: number }> {
    const storage = getStorage();
    return Object.entries(storage.players)
        .map(([name, stats]) => ({
            name,
            bestScore: stats.bestScore,
            gamesPlayed: stats.gamesPlayed
        }))
        .sort((a, b) => b.bestScore - a.bestScore)
        .slice(0, 10);
}
