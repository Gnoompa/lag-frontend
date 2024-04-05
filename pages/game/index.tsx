"use client";

import { Flex, Text, Image } from "rebass/styled-components";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { currentEpochAtom, currentEpochTimeAtom, globalScoreAtom, scoreAtom } from "../../state";
import { getCurrentEpoch } from "../../StateInit";
import { GAME_STAGES_DURATION } from "../../const";
import { useFloatie } from "../../features/useFloatie";
import { useAtomValue, useSetAtom } from "jotai";
import atomWithDebounce from "@/atoms/debouncedAtom";
import { usePrivy } from "@privy-io/react-auth";
import useArweave from "@/features/useArweave";
import { Footer } from "@/components/Footer";

const { debouncedValueAtom: debouncedScoreAtom, currentValueAtom: debouncedScoreAtomValue } =
  atomWithDebounce(0);

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
        updatedScoreDeltaRef.current > 90 ? ["color:red"] : ["color:#070606"]
      ),
    !!updatedScoreDelta
  );

  useEffect(() => {
    setGameEpoch(getCurrentEpoch());

    chooseWorm();
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
    score && (setPersistedScore(score), setDebouncedScore(score));
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
    ((scoreIncrement) => handleTap(scoreIncrement))(Math.floor(1 + Math.random() * 100));
  };

  const onTap = () => {
    chosenSide === PlayerSide.Worm ? tapHarvester() : tapWorm();
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
          ? "linear-gradient(#0500FF,#000000)"
          : "linear-gradient(#FF6B00,#FAFF00)",
      }}
    >
      <motion.img
        src={"/cloudy.png"}
        animate={{ right: ["-120%", "120%"] }}
        transition={{ repeatType: "mirror", repeat: Infinity, duration: 4, type: "just", delay: 2 }}
        style={{
          position: "fixed",
          top: "10%",
        }}
      ></motion.img>
      <motion.img
        src={"/cloudy.png"}
        animate={{ left: ["-120%", "120%"] }}
        transition={{ repeatType: "mirror", repeat: Infinity, duration: 4, type: "just", delay: 1 }}
        style={{
          position: "fixed",
          top: "40%",
        }}
      ></motion.img>

      <Image
        src={"/lag.png"}
        width={["100vw", "min(100%, 15rem)"]}
        maxWidth={"45vh"}
        style={{
          position: "fixed",
          bottom: "2rem",
          // width: "min(100%, 20rem)",
          transform:
            chosenSide === PlayerSide.Harvester ? "scale(.5)" : `translateY(${(score % 3) * 20}px)`,
          transition: ".2s",
        }}
      ></Image>
      {/* <img
        src={"/sand.png"}
        style={{
          position: "fixed",
          bottom: chosenSide === PlayerSide.Worm ? "-20%" : "-35%",
          width: "100%",
          height: "50vh",
          transition: ".25s",
        }}
      ></img> */}

      <Image
        src={"/austin.png"}
        width={["50%", "min(100%, 7rem)"]}
        maxHeight={"30%"}
        style={{
          position: "fixed",
          top: "8rem",
          transition: ".2s",
          transform: `rotateZ(${score % 3 > 1 ? -10 : 10}deg)`,
        }}
      ></Image>

      <Flex
        flexDirection={"column"}
        alignItems={"center"}
        style={{
          position: "fixed",
          top: "4rem",
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
              style={{ width: `${100 - ((globalScore || 1) / 1e7) * 100}%` }}
            ></rect>
          </svg>
        </svg>
        <Text
          color={"--lagwhite"}
          fontWeight={500}
          marginTop={"-3.75rem"}
          fontSize={"1.25rem"}
          // style={{ "-webkit-text-stroke-width": "1px", "-webkit-text-stroke-color": "black" }}
        >
          {1e7 - globalScore}
        </Text>
      </Flex>
      <Flex
        backgroundColor={"var(--lagblack)"}
        p={".5rem 1rem"}
        width={"100%"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Flex flexDirection={"column"}>
          <Text color="var(--lagwhite)">EPOCH {currentEpoch}</Text>
          <Text color="var(--lagwhite)">
            {currentEpochTime}/{GAME_STAGES_DURATION[0] / 60}m
          </Text>
        </Flex>
        <Flex flexDirection={"column"} alignItems={"flex-end"}>
          <Text color="var(--lagwhite)">DEGENS</Text>
          <Text color="var(--lagwhite)">1 🟢</Text>
        </Flex>
      </Flex>
      <Flex
        flexDirection={"column"}
        alignItems={"center"}
        style={{ position: "fixed", top: ".75rem" }}
      >
        <Text color="var(--lagwhite)" fontWeight={"bold"}>
          SEASON 1
        </Text>
        <Text color="var(--lagwhite)" opacity={0.5} fontSize={".75rem"}>
          “DOUBLE TAP“
        </Text>
      </Flex>
      {phase === GamePhase.ChooseSide && (
        <Flex justifyContent={"center"}>
          {/* <Text
            fontSize={"4rem"}
            color={"#111"}
            fontWeight={"900"}
            style={{ position: "fixed", bottom: "calc(50vh - 4rem)" }}
          >
            VS
          </Text> */}
          {/* <Text
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
          </Text> */}
        </Flex>
      )}

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
      <Image
        src={"/thunder.png"}
        height={"50%"}
        opacity={isOnSpice ? 1 : 0}
        style={{
          pointerEvents: "none",
          position: "fixed",
          left: "0",
          top: "5%",
          transition: ".5s",
          transform: `rotateZ(-20deg)`,
        }}
      ></Image>
      <Footer />
    </Flex>
  );
}
