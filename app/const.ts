export const GENESIS_EPOCH_TIMESTAMP = 1711384626
export const GAME_STAGES_DURATION = [60, 30, 30]

export enum EGameStage {
    Active,
    Commit,
    Reveal,
    Distribute
}

export enum EGameStageDuration {
    Active = 60,
    Commit = 30,
    Reveal = 30,
}

export enum EPlayerRole {
    Worm,
    Harvester,
    Tie
}

export const EPlayerRoleLabel = [
    "worm",
    "harvestr",
    "it is a tie"
]

export enum EWinningRole {
    Worm,
    Harvester,
    Tie
}