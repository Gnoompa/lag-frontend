"use client";

import { Flex, Text } from "rebass/styled-components";
import { useEffect, useRef, useState } from "react";
import {
  currentEpochAtom,
  currentEpochTimeAtom,
  globalScoreAtom,
  scoreAtom,
} from "../../state";
import { getCurrentEpoch } from "../../StateInit";
import { GAME_STAGES_DURATION } from "../../const";
import { useFloatie } from "../../features/useFloatie";
import { useAtomValue, useSetAtom } from "jotai";
import atomWithDebounce from "@/atoms/debouncedAtom";
import { usePrivy } from "@privy-io/react-auth";
import useArweave from "@/features/useArweave";

const {
  debouncedValueAtom: debouncedScoreAtom,
  currentValueAtom: debouncedScoreAtomValue,
} = atomWithDebounce(0);

export default function Game() {
  enum GamePhase {
    ChooseSide,
    Active,
  }

  enum PlayerSide {
    Worm,
    Harvester,
  }

  const currentEpoch = useAtomValue(currentEpochAtom);
  const currentEpochTime = useAtomValue(currentEpochTimeAtom);

  const debouncedScore = useAtomValue(debouncedScoreAtom);
  const setDebouncedScore = useSetAtom(debouncedScoreAtom);

  const globalScore = useAtomValue(globalScoreAtom);
  const setGlobalScore = useSetAtom(globalScoreAtom);

  const persistedScore = useAtomValue(scoreAtom);
  const setPersistedScore = useSetAtom(scoreAtom);

  const { ready, user, signMessage } = usePrivy();
  const ar = useArweave(user?.wallet?.address, signMessage);

  const [gameEpoch, setGameEpoch] = useState(0);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.ChooseSide);
  const [chosenSide, setChosenSide] = useState<PlayerSide>();
  const [score, setScore] = useState<number>(0);
  const [updatedScoreDelta, setUpdatedScoreDelta] = useState<number>(0);
  const [isOnSpice, setIsOnSpice] = useState(false);

  const updatedScoreDeltaRef = useRef(updatedScoreDelta);

  const floatieRef = useFloatie(
    // @ts-ignore
    (cb) =>
      cb(
        updatedScoreDeltaRef.current > 90
          ? `${updatedScoreDeltaRef.current}!!!`
          : `${updatedScoreDeltaRef.current}`,
        updatedScoreDeltaRef.current > 90 ? ["color:red"] : []
      ),
    !!updatedScoreDelta
  );

  useEffect(() => {
    setGameEpoch(getCurrentEpoch());
  }, []);

  // useEffect(() => {
  //   console.log(user)
  //   ready &&
  //     user?.wallet?.address &&
  //     ar.auth(user?.wallet?.address, signMessage);
  // }, [ready, user]);

  useEffect(() => {
    chosenSide !== undefined &&
      // @ts-ignore
      (setPhase(GamePhase.Active), ar.auth(user?.wallet?.address, signMessage));
  }, [chosenSide]);

  useEffect(() => {
    isOnSpice && setTimeout(() => setIsOnSpice(false), 3000);
  }, [isOnSpice]);

  useEffect(() => {
    score && setDebouncedScore(score);
  }, [score]);

  useEffect(() => {
    updatedScoreDelta &&
      (setGlobalScore(globalScore + updatedScoreDelta),
      setPersistedScore(persistedScore + updatedScoreDelta));
  }, [updatedScoreDelta]);

  useEffect(() => {
    debouncedScore && commitScore(currentEpoch, debouncedScore);
  }, [currentEpoch, debouncedScore]);

  const commitScore = (epoch: number, score: number) => {
    ar.write({
      function: "commit",
      epoch,
      score,
    });
  };

  // useEffect(() => {
  //   gameEpoch !== undefined &&
  //     currentEpoch > gameEpoch &&
  //     score &&
  //     location(`/commit/${gameEpoch}/${chosenSide}/${score}`);
  // }, [gameEpoch, currentEpoch]);

  const chooseHarvester = () => {
    setChosenSide(PlayerSide.Harvester);
  };

  const tapHarvester = () => {
    Math.random() > 0.9 && setIsOnSpice(true);

    // @ts-ignore
    handleTap(isOnSpice ? 100 : 1, isOnSpice && "heavy");
  };

  const chooseWorm = () => {
    setChosenSide(PlayerSide.Worm);
  };

  const tapWorm = () => {
    ((scoreIncrement) => handleTap(scoreIncrement))(
      Math.floor(1 + Math.random() * 100)
    );
  };

  const onTap = () => {
    chosenSide === PlayerSide.Harvester ? tapHarvester() : tapWorm();
  };

  const handleTap = (scoreIncrement: number, hapticFeedback?: string) => {
    setScore(score + scoreIncrement);
    setUpdatedScoreDelta(scoreIncrement);

    updatedScoreDeltaRef.current = scoreIncrement;

    // @ts-ignore
    Telegram.WebApp.HapticFeedback.impactOccurred(
      hapticFeedback || (scoreIncrement > 90 ? "heavy" : "light")
    );
  };

  return (
    <Flex
      width={"100%"}
      flexDirection={"column"}
      alignItems={"center"}
      height={"100vh"}
      style={{
        background: isOnSpice
          ? "linear-gradient(#98A5FF,#FEFCFF)"
          : "transparent",
      }}
    >
      <img
        src={"/spiced.png"}
        style={{
          position: "fixed",
          top: "20%",
          width: "100%",
          transform: isOnSpice ? "scale(1)" : "scale(0)",
          transition: ".2s",
        }}
      ></img>
      <img
        src={"/worm.png"}
        style={{
          position: "fixed",
          bottom: chosenSide === PlayerSide.Worm ? "15%" : "-5%",
          width: "min(100%, 20rem)",
          transform:
            chosenSide === PlayerSide.Harvester
              ? "scale(.5)"
              : `translateY(${(score % 3) * 20}px)`,
          transition: ".2s",
        }}
      ></img>
      <img
        src={"/sand.png"}
        style={{
          position: "fixed",
          bottom: chosenSide === PlayerSide.Worm ? "-20%" : "-35%",
          width: "100%",
          height: "50vh",
          transition: ".25s",
        }}
      ></img>
      <img
        src={"/harvester.png"}
        style={{
          position: "fixed",
          top: chosenSide === PlayerSide.Harvester ? "30%" : "10%",
          width: "min(100%, 20rem)",
          transition: ".2s",
          transform:
            chosenSide == PlayerSide.Worm
              ? "scale(.5)"
              : `translateY(${(-score % 3) * 20}px) ${
                  isOnSpice ? "scale(1.5)" : ""
                }`,
        }}
      ></img>
      {chosenSide !== undefined && (
        <Flex
          flexDirection={"column"}
          alignItems={"center"}
          style={{
            position: "fixed",
            top: chosenSide == PlayerSide.Harvester ? "70%" : "30%",
          }}
        >
          <svg
            className="healthbar"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -0.5 38 9"
            shapeRendering="crispEdges"
          >
            <path
              stroke="#222034"
              d="M2 2h1M3 2h32M3  3h1M2 3h1M35 3h1M3 4h1M2 4h1M35 4h1M3  5h1M2 5h1M35 5h1M3 6h32M3"
            ></path>
            <path stroke="#323c39" d="M3 3h32"></path>
            <path stroke="#494d4c" d="M3 4h32M3 5h32"></path>
            <svg x="3" y="2.5" width="32" height="3">
              <rect
                className="healthbar_fill"
                height="3"
                style={{ width: `${100 - ((globalScore || 1) / 1e5) * 100}%` }}
              ></rect>
            </svg>
          </svg>
          <Text color={"#222"} marginTop={"-30px"}>
            {1e5 - globalScore}
          </Text>
        </Flex>
      )}
      <Flex
        backgroundColor={"#4C3827"}
        p={".5rem"}
        width={"100%"}
        justifyContent={"center"}
      >
        <Text color="#fff">
          epoch #{currentEpoch} - {currentEpochTime}
          {" | "}
          {GAME_STAGES_DURATION[0] / 60}m
        </Text>
      </Flex>
      {isOnSpice && (
        <Text
          fontSize={"1.5rem"}
          color={"#111"}
          fontWeight={"900"}
          style={{ position: "fixed", top: "2.5rem" }}
        >
          spiced up to 10x
        </Text>
      )}
      {phase === GamePhase.ChooseSide && (
        <Flex justifyContent={"center"}>
          <Text
            fontSize={"4rem"}
            color={"#111"}
            fontWeight={"900"}
            style={{ position: "fixed", bottom: "calc(50vh - 4rem)" }}
          >
            VS
          </Text>
          <Text
            fontSize={"1.5rem"}
            color={"#111"}
            fontWeight={"900"}
            style={{ position: "fixed", top: "2.5rem" }}
          >
            tap harvstr to harvst
          </Text>
          <Text
            fontSize={"1.5rem"}
            color={"#111"}
            fontWeight={"900"}
            style={{ position: "fixed", bottom: "2.5rem" }}
          >
            tap worm to eat
          </Text>
        </Flex>
      )}
      {phase === GamePhase.Active && (
        <Flex
          style={{
            position: "fixed",
            bottom: "2.75rem",
            pointerEvents: "none",
          }}
          width={"100%"}
        >
          <Flex
            // backgroundColor={"#4C3827"}
            p={".5rem"}
            width={"100%"}
            justifyContent={"center"}
          >
            <Text fontSize={"1.5rem"} fontWeight={900} color="#111">
              SCORE: {score}
            </Text>
          </Flex>
        </Flex>
      )}
      {chosenSide === undefined ? (
        <Flex>
          <span
            onClick={chooseHarvester}
            style={{ position: "fixed", width: "100%", height: "50vh", top: 0 }}
          ></span>
          <span
            onClick={chooseWorm}
            style={{
              position: "fixed",
              width: "100%",
              height: "50vh",
              bottom: 0,
            }}
          ></span>
        </Flex>
      ) : (
        <span
          ref={floatieRef}
          onMouseDown={onTap}
          style={{
            userSelect: "none",
            position: "fixed",
            width: "100%",
            height: "100vh",
            bottom: 0,
          }}
        ></span>
      )}

      {/* <img src={AustinImage} style={{ position: "fixed", bottom: "10rem", transform: "rotateZ(30deg)", left: "-3rem", width: "10rem" }}></img> */}
      {/* <img src={LagImage} style={{ position: "fixed", bottom: "11rem", transform: "rotateZ(-60deg)", right: "-4rem", width: "10rem" }}></img> */}
    </Flex>
  );
}
