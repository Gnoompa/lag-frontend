"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
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
  const { read, arWallet } = useArweave(user?.wallet?.address);

  const [player, setPlayer] = useAtom(persistedPlayerStateAtom);

  const [energy, setEnergy] = useAtom(energyAtom);

  const [persistedPlayerState, setPersistedPlayerState] = useAtom(persistedPlayerStateAtom);
  const [persistedPlayerScore, setPersistedPlayerScore] = useAtom(persistedPlayerScoreAtom);
  const setClientPlayerScore = useSetAtom(clientPlayerScoreAtom);

  const [persistedGlobalState, setPersistedGlobalState] = useAtom(persistedGlobalStateAtom);
  const setPersistedGlobaScore = useSetAtom(persistedGlobalScoreAtom);
  const setClientGlobalScore = useSetAtom(clientGlobalScoreAtom);

  useEffect(() => {
    initEpochs();
    initEnergy();
    syncGlobalState();
  }, []);

  useEffect(() => {
    persistedPlayerState &&
      // @ts-ignore
      (setPersistedPlayerScore(persistedPlayerState.score),
      // @ts-ignore
      setClientPlayerScore(persistedPlayerState.score));
  }, [persistedPlayerState]);

  useEffect(() => {
    persistedGlobalState &&
      // @ts-ignore
      (setPersistedGlobaScore(persistedGlobalState.score),
      // @ts-ignore
      setClientGlobalScore(persistedGlobalState.score));
  }, [persistedGlobalState]);

  useEffect(() => {
    ready && authenticated && arWallet && syncUserState();
  }, [authenticated, ready, user, arWallet]);

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

  const syncGlobalState = () => {
    read({
      function: "global",
      // @ts-ignore
    }).then(({ result }) => result && setPersistedGlobalState(result));
  };

  const syncUserState = () => {
    read({
      function: "user",
      id: arWallet?.address,
      // @ts-ignore
    }).then(({ result }) => result && setPersistedPlayerState(result));
  };

  return <></>;
}
