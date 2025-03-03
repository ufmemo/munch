interface GameSpeedLevel {
  pacman: number;
  ghost: number;
}

interface GameTimings {
  frightenedDuration: number; // Duration of ghost frightened mode in milliseconds
  respawnDuration: number; // Duration before ghost respawns after being eaten
  animationSpeeds: {
    pacmanChomp: number; // seconds
    ghostFloat: number; // seconds
    deathSequence: number; // seconds
  };
}

interface GameDifficulty {
  speedLevels: GameSpeedLevel[];
  initialLives: number;
  baseScores: {
    dot: number;
    powerPellet: number;
    ghost: number;
  };
  timings: GameTimings;
}

// Game difficulty settings
export const GAME_DIFFICULTY: GameDifficulty = {
  speedLevels: [
    { pacman: 6, ghost: 4.5 }, // Level 1
    { pacman: 8, ghost: 6.5 }, // Level 2
    { pacman: 10, ghost: 9 }, // Level 3
  ],
  initialLives: 3,
  baseScores: {
    dot: 10,
    powerPellet: 50,
    ghost: 200,
  },
  timings: {
    frightenedDuration: 30000, // 30 seconds
    respawnDuration: 10000, // 10 seconds
    animationSpeeds: {
      pacmanChomp: 0.25,
      ghostFloat: 1.5,
      deathSequence: 1,
    },
  },
};
