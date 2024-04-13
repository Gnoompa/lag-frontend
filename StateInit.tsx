"use client";

import { useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  currentEpochAtom,
  currentEpochTimeAtom,
  energyAtom,
  globalScoreAtom,
  scoreAtom,
  spoiceAtom,
  store,
} from "./state";
import { GAME_STAGES_DURATION, GENESIS_EPOCH_TIMESTAMP, MAX_SCORE_PER_EPOCH } from "./const";
import useArweave from "@/features/useArweave";
import { min } from "lodash";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

export const getCurrentEpoch = () =>
  ~~((Date.now() / 1000 - GENESIS_EPOCH_TIMESTAMP) / GAME_STAGES_DURATION[0]);

export const getCurrentEpochTime = () =>
  ((time) => `${~~(time / 60)}:${~~(time - ~~(time / 60) * 60)}`)(
    ~~(Date.now() / 1000 - GENESIS_EPOCH_TIMESTAMP) - GAME_STAGES_DURATION[0] * getCurrentEpoch()
  );

export function State() {
  const { user, signMessage } = usePrivy();
  const { read } = useArweave(user?.wallet?.address, signMessage);

  const score = useAtomValue(scoreAtom);
  const setScore = useSetAtom(scoreAtom);

  const [energy, setEnergy] = useAtom(energyAtom);

  const epoch = useAtomValue(currentEpochAtom);

  const setGlobalScore = useSetAtom(globalScoreAtom);

  const spoice = useAtomValue(spoiceAtom);
  const setSpoice = useSetAtom(spoiceAtom);

  useEffect(() => {
    initEpochs();
    initEnergy();
    syncGlobalScore();
  }, []);

  useEffect(() => {
    user?.wallet?.address && (fetchScore(user?.wallet?.address), syncUserScore());
  }, [user]);

  useEffect(() => {
    // score && setSpoice(+Math.log10(score).toFixed(0));
    score;
  }, [score, epoch]);

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

  const fetchScore = (address: string) =>
    read({
      function: "score",
      user: address,
    }).then(({ result }) => setScore(result as number));

  const initEpochs = () => {
    store.set(currentEpochAtom, getCurrentEpoch());
    store.set(currentEpochTimeAtom, getCurrentEpochTime());

    setInterval(() => store.set(currentEpochAtom, getCurrentEpoch()), 1000);
    setInterval(() => store.set(currentEpochTimeAtom, getCurrentEpochTime()), 1000);
  };

  const syncGlobalScore = () => {
    read({
      function: "score",
      user: "global",
    }).then(({ result }) => setGlobalScore((result as number) || 0));
  };

  const syncUserScore = () => {
    read({
      function: "score",
      user: user?.wallet?.address,
    }).then(({ result }) => setScore((result as number) || 0));
  };

  return <></>;
}
