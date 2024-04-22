"use client"

import { atom, createStore } from 'jotai';
import { EGameStage, MAX_SCORE_PER_EPOCH } from "./const";

export const currentEpochAtom = atom(0)
export const activeEpochAtom = atom(0);

export const energyAtom = atom(MAX_SCORE_PER_EPOCH);

export const arContractStateAtom = atom<object | undefined>(undefined)

export const persistedPlayerStateAtom = atom<object | undefined>(undefined)
export const persistedPlayerScoreAtom = atom<number | undefined>(undefined)
export const clientPlayerScoreAtom = atom<number | undefined>(undefined)

export const persistedGlobalStateAtom = atom<object | undefined>(undefined)
export const persistedGlobalScoreAtom = atom<number | undefined>(undefined)
export const clientGlobalScoreAtom = atom<number | undefined>(undefined)

export const currentEpochTimeAtom = atom("")
export const gameStageAtom = atom<EGameStage | undefined>(undefined)

export const store = createStore()