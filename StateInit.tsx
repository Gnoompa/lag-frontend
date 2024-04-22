"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  arContractStateAtom,
  clientGlobalScoreAtom,
  clientPlayerScoreAtom,
  currentEpochAtom,
  currentEpochTimeAtom,
  energyAtom,
  persistedGlobalScoreAtom,
  persistedGlobalStateAtom,
  persistedPlayerScoreAtom,
  persistedPlayerStateAtom,
  store,
} from "./state";
import { GAME_STAGES_DURATION, GENESIS_EPOCH_TIMESTAMP, MAX_SCORE_PER_EPOCH } from "./const";
import useArweave from "@/features/useArweave";
import { min } from "lodash";
import { useAtom, useSetAtom } from "jotai";
import useWallet from "./features/useWallet";

export const getCurrentEpoch = () =>
  ~~((Date.now() / 1000 - GENESIS_EPOCH_TIMESTAMP) / GAME_STAGES_DURATION[0]);

export const getCurrentEpochTime = () =>
  ((time) => `${~~(time / 60)}:${~~(time - ~~(time / 60) * 60)}`)(
    ~~(Date.now() / 1000 - GENESIS_EPOCH_TIMESTAMP) - GAME_STAGES_DURATION[0] * getCurrentEpoch()
  );

export function State() {
  const { user, ready, authenticated, signMessage } = usePrivy();
  const { wallet } = useWallet();
  const { read, readState, arWallet } = useArweave(user?.wallet?.address);

  const [player, setPlayer] = useAtom(persistedPlayerStateAtom);

  const [energy, setEnergy] = useAtom(energyAtom);

  const [arContractState, setArContractState] = useAtom(arContractStateAtom);

  const [persistedPlayerState, setPersistedPlayerState] = useAtom(persistedPlayerStateAtom);
  const [persistedPlayerScore, setPersistedPlayerScore] = useAtom(persistedPlayerScoreAtom);
  const setClientPlayerScore = useSetAtom(clientPlayerScoreAtom);

  const [persistedGlobalState, setPersistedGlobalState] = useAtom(persistedGlobalStateAtom);
  const setPersistedGlobaScore = useSetAtom(persistedGlobalScoreAtom);
  const setClientGlobalScore = useSetAtom(clientGlobalScoreAtom);

  useEffect(() => {
    initEpochs();
    initEnergy();
    syncArContractState();
  }, []);

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
    console.log(arContractState);
    arContractState &&
      // @ts-ignore
      (setPersistedGlobaScore(arContractState.global.score || 0),
      // @ts-ignore
      setClientGlobalScore(arContractState.global.score || 0));
  }, [arContractState]);

  useEffect(() => {
    ready &&
      authenticated &&
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

  const initEnergy = () => {
    setInterval(
      () =>
        setEnergy(
          (oldEnergy) =>
            min([oldEnergy + 10 > MAX_SCORE_PER_EPOCH ? MAX_SCORE_PER_EPOCH : oldEnergy + 10]) ||
            MAX_SCORE_PER_EPOCH
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
