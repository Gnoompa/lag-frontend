// use client

export const GENESIS_EPOCH_TIMESTAMP = 1711384626;
export const GAME_STAGES_DURATION = [60, 30, 30];

export const MAX_SCORE = 10_000;
export const MAX_ENERGY = 10_000;
export const SCORE_ENERGY_RECHARGE_INTERVAL = 3_600; // p/s
export const ENERGY_RESTORE_PER_SECOND = MAX_ENERGY / SCORE_ENERGY_RECHARGE_INTERVAL;
export const GANG_LEVEL_STEP = 10_000;

// @ts-ignore
// export const VENDOR_CONFIG = {
//   colors: {
//     bg: "linear-gradient(180deg, #D4C1B0 0%, #FEFCFF 100%)",
//     fg: "black"
//   },
//   labels: {
//     vendor: "Lisan al Gaib",
//     welcome: "degENTER"
//   },
//   assets: {
//     starter: "/lag.png"
//   }
// } as {
export const VENDOR_CONFIG = global.__LAG_VENDOR_CONFIG as {
  preset?: "rugged" | "smooth";
  colors?: {
    bg?: string;
    cbg?: string;
    fg?: string;
    cfg?: string;
  };
  assets?: {
    starter?: string;
    token?: string;
    energy?: string;
  };
  labels?: {
    vendor?: string;
    welcome?: string;
    token?: string;
    energy?: string;
    raid?: string;
    lottery?: string;
    checkin?: string;
  };
};

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
    ticker: "MINU",
    label: "Mantle Inu",
    id: "5000:0x51cfe5b1E764dC253F4c8C1f19a081fF4C3517eD",
    chainId: 5000,
    address: "0x51cfe5b1E764dC253F4c8C1f19a081fF4C3517eD",
    icon: "https://framerusercontent.com/images/f0KebTk7fBlOgTfRSJe1xIo0HMw.png",

  },
  {
    ticker: "PUFF",
    label: "Puff",
    id: "5000:0x26a6b0dcdCfb981362aFA56D581e4A7dBA3Be140",
    chainId: 5000,
    address: "0x26a6b0dcdCfb981362aFA56D581e4A7dBA3Be140",
    icon: "https://puffthedragon.xyz/_next/image?url=%2Fimages%2Flogo.webp&w=96&q=75",
  },
  {
    label: "Merchant Moe",
    ticker: "MOE",
    id: "5000:0x4515A45337F461A11Ff0FE8aBF3c606AE5dC00c9",
    address: "0x4515A45337F461A11Ff0FE8aBF3c606AE5dC00c9",
    chainId: 5000,
    icon: "https://dd.dexscreener.com/ds-data/tokens/mantle/0x4515a45337f461a11ff0fe8abf3c606ae5dc00c9.png?size=lg&key=430a64",
  },
];

export const GANGS = ERC20_TOKENS.map((token) => ({
  image: token.icon,
  name: token.label,
  address: token.address,
  score: 0,
  id: token.id,
}));
