export const GENESIS_EPOCH_TIMESTAMP = 1711384626;
export const GAME_STAGES_DURATION = [60, 30, 30];

export const MAX_SCORE = 10_000;
export const MAX_ENERGY = 10_000;
export const SCORE_ENERGY_RECHARGE_INTERVAL = 3_600; // p/s
export const ENERGY_RESTORE_PER_SECOND = MAX_ENERGY / SCORE_ENERGY_RECHARGE_INTERVAL;
export const GANG_LEVEL_STEP = 10_000

export enum EGameStage {
  Active,
  Commit,
  Reveal,
  Distribute,
}

export enum EGameStageDuration {
  Active = 60,
  Commit = 30,
  Reveal = 30,
}

export enum EPlayerRole {
  Worm,
  Harvester,
  Tie,
}

export const EPlayerRoleLabel = ["worm", "harvestr", "it is a tie"];

export enum EWinningRole {
  Worm,
  Harvester,
  Tie,
}

export const ERC20_TOKENS = [
  {
    label: "$INU",
    id: "inu",
    image: "https://framerusercontent.com/images/f0KebTk7fBlOgTfRSJe1xIo0HMw.png",
    value: 213,
  },
  {
    label: "$PUFF",
    id: "puff",
    image: "https://puffthedragon.xyz/_next/image?url=%2Fimages%2Flogo.webp&w=96&q=75",
    value: 113,
  },
  {
    label: "$SHIB",
    id: "shib",
    image: "https://s2.coinmarketcap.com/static/img/coins/200x200/5994.png",
    value: 73,
  },
];

export const GANGS = ERC20_TOKENS.map((token) => ({
  image: token.image,
  name: token.label,
  score: 0,
  id: token.id,
}));
