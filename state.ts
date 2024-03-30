"use client"

import { atom, createStore } from 'jotai';
import { EGameStage } from "./const";

export const currentEpochAtom = atom(0)
export const activeEpochAtom = atom(0);
export const scoreAtom = atom(0);
export const globalScoreAtom = atom(0);
export const spoiceAtom = atom(0);
export const currentEpochTimeAtom = atom("")
export const gameStageAtom = atom<EGameStage | undefined>(undefined)

export const store = createStore()