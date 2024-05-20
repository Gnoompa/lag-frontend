"use client";

import { useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  arContractStateAtom,
  clientGlobalScoreAtom,
  clientPlayerScoreAtom,
  currentEpochAtom,
  currentEpochTimeAtom,
  debouncedEnergyAtom,
  energyAtom,
  persistedGlobalScoreAtom,
  persistedGlobalStateAtom,
  persistedPlayerScoreAtom,
  persistedPlayerStateAtom,
  persistedStateAtom,
  store,
} from "./state";
import {
  ENERGY_RESTORE_PER_SECOND,
  GAME_STAGES_DURATION,
  GENESIS_EPOCH_TIMESTAMP,
  MAX_ENERGY,
} from "./const";
import useArweave from "@/features/useArweave";
import { min } from "lodash";
import { useAtom, useSetAtom } from "jotai";

export const getCurrentEpoch = () =>
  ~~((Date.now() / 1000 - GENESIS_EPOCH_TIMESTAMP) / GAME_STAGES_DURATION[0]);

export const getCurrentEpochTime = () =>
  ((time) => `${~~(time / 60)}:${~~(time - ~~(time / 60) * 60)}`)(
    ~~(Date.now() / 1000 - GENESIS_EPOCH_TIMESTAMP) - GAME_STAGES_DURATION[0] * getCurrentEpoch()
  );

export function State() {
  const { user, ready, authenticated, signMessage } = usePrivy();
  const { ready: arReady, read, readState, arWallet } = useArweave(user?.wallet?.address);

  const [energy, setEnergy] = useAtom(energyAtom);

  const [arContractState, setArContractState] = useAtom(arContractStateAtom);

  const [persistedState, setPersistedState] = useAtom(persistedStateAtom);
  const [persistedPlayerState, setPersistedPlayerState] = useAtom(persistedPlayerStateAtom);
  const [persistedPlayerScore, setPersistedPlayerScore] = useAtom(persistedPlayerScoreAtom);
  const setClientPlayerScore = useSetAtom(clientPlayerScoreAtom);

  const [persistedGlobalState, setPersistedGlobalState] = useAtom(persistedGlobalStateAtom);
  const setPersistedGlobaScore = useSetAtom(persistedGlobalScoreAtom);
  const setClientGlobalScore = useSetAtom(clientGlobalScoreAtom);

  const [debouncedEnergy, setDebouncedEnergy] = useAtom(debouncedEnergyAtom);
  const energyIntervalRef = useRef<any>();

  console.log(arContractState);

  useEffect(() => {
    initEpochs();
    syncArContractState();
  }, [arWallet]);

  useEffect(() => {
    arReady && syncArContractState();
  }, [arReady]);

  // useEffect(() => {
  //   persistedPlayerState &&
  //     // @ts-ignore
  //     (setPersistedPlayerScore(persistedPlayerState.score || 0),
  //     // @ts-ignore
  //     setClientPlayerScore(persistedPlayerState.score || 0));
  // }, [persistedPlayerState]);

  useEffect(() => {
    arContractState &&
      // @ts-ignore
      (setPersistedState(arContractState),
      // @ts-ignore
      setPersistedGlobaScore(arContractState.global.score || 0),
      // @ts-ignore
      setPersistedGlobalState(arContractState.global),
      // @ts-ignore
      setClientGlobalScore(arContractState.global.score || 0));
  }, [arContractState]);

  useEffect(() => {
    ready &&
      arWallet &&
      arContractState &&
      // @ts-ignore
      setPersistedPlayerState(arContractState.users[arWallet.address] || {});
  }, [authenticated, ready, user, arContractState, arWallet]);

  useEffect(() => {
    persistedPlayerState &&
      // @ts-ignore
      (setPersistedPlayerScore(persistedPlayerState.score),
      // @ts-ignore
      setClientPlayerScore(persistedPlayerState.score),
      initEnergy());
  }, [persistedPlayerState]);

  useEffect(() => {
    setDebouncedEnergy(energy);
  }, [energy]);

  const initEnergy = () => {
    energyIntervalRef.current === undefined &&
      persistedPlayerState &&
      (setEnergy(
        min([
          // @ts-ignore
          persistedPlayerState?.energy[persistedPlayerState.currentGang] !== undefined
            ? // @ts-ignore
              persistedPlayerState?.energy[persistedPlayerState.currentGang] +
              ((Date.now() -
                // @ts-ignore
                (persistedPlayerState?.score[persistedPlayerState.currentGang]?.lastTimestamp ||
                  0)) /
                1000) *
                ENERGY_RESTORE_PER_SECOND
            : MAX_ENERGY,
          MAX_ENERGY,
        ])
      ),
      (energyIntervalRef.current = setInterval(
        () => setEnergy((oldValue) => min([oldValue! + ENERGY_RESTORE_PER_SECOND, MAX_ENERGY])),
        1000
      )));
  };

  const initEpochs = () => {
    store.set(currentEpochAtom, getCurrentEpoch());
    store.set(currentEpochTimeAtom, getCurrentEpochTime());

    setInterval(() => store.set(currentEpochAtom, getCurrentEpoch()), 1000);
    setInterval(() => store.set(currentEpochTimeAtom, getCurrentEpochTime()), 1000);
  };

  const syncArContractState = () => {
    readState().then((value) => setArContractState(value?.cachedValue?.state as {}));
  };

  // const syncGlobalState = () => {
  //   read({
  //     function: "global",
  //     // @ts-ignore
  //   }).then(({ result }) => result && setPersistedGlobalState(result));
  // };

  return <></>;
}
