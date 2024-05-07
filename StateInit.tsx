"use client";

import { useEffect } from "react";
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
  store,
} from "./state";
import {
  ENERGY_RESTORE_PER_SECOND,
  GAME_STAGES_DURATION,
  GENESIS_EPOCH_TIMESTAMP,
  MAX_SCORE_PER_MIN,
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

  const [persistedPlayerState, setPersistedPlayerState] = useAtom(persistedPlayerStateAtom);
  const [persistedPlayerScore, setPersistedPlayerScore] = useAtom(persistedPlayerScoreAtom);
  const setClientPlayerScore = useSetAtom(clientPlayerScoreAtom);

  const [persistedGlobalState, setPersistedGlobalState] = useAtom(persistedGlobalStateAtom);
  const setPersistedGlobaScore = useSetAtom(persistedGlobalScoreAtom);
  const setClientGlobalScore = useSetAtom(clientGlobalScoreAtom);

  const [debouncedEnergy, setDebouncedEnergy] = useAtom(debouncedEnergyAtom);

  useEffect(() => {
    initEpochs();
    initEnergy();
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

  // useEffect(() => {
  //   persistedGlobalState &&
  //     // @ts-ignore
  //     (setPersistedGlobaScore(persistedGlobalState.score || 0),
  //     // @ts-ignore
  //     setClientGlobalScore(persistedGlobalState.score || 0));
  // }, [persistedGlobalState]);

  useEffect(() => {
    arContractState &&
      // @ts-ignore
      (setPersistedGlobaScore(arContractState.global.score || 0),
      // @ts-ignore
      setClientGlobalScore(arContractState.global.score || 0));
  }, [arContractState]);

  useEffect(() => {
    ready &&
      arWallet &&
      arContractState &&
      // @ts-ignore
      setPersistedPlayerState(arContractState.users[arWallet.address]);
  }, [authenticated, ready, user, arContractState, arWallet]);

  useEffect(() => {
    persistedPlayerState &&
      // @ts-ignore
      (setPersistedPlayerScore(persistedPlayerState.score),
      // @ts-ignore
      setClientPlayerScore(persistedPlayerState.score));
  }, [persistedPlayerState]);

  useEffect(() => {
    setDebouncedEnergy(energy);
  }, [energy]);

  const initEnergy = () => {
    setInterval(
      () =>
        setEnergy(
          (oldEnergy: number) =>
            min([
              oldEnergy + ENERGY_RESTORE_PER_SECOND > MAX_SCORE_PER_MIN
                ? MAX_SCORE_PER_MIN
                : oldEnergy + ENERGY_RESTORE_PER_SECOND,
            ]) || MAX_SCORE_PER_MIN
        ),
      1000
    );
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
