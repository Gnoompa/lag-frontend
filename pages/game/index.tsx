"use client";

import { Flex, Text, Image } from "rebass/styled-components";
import { useEffect, useRef, useState } from "react";
import {
  currentEpochAtom,
  currentEpochTimeAtom,
  energyAtom,
  globalScoreAtom,
  scoreAtom,
} from "../../state";
import { getCurrentEpoch } from "../../StateInit";
import { useFloatie } from "../../features/useFloatie";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
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

  const [energy, setEnergy] = useAtom(energyAtom);

  const persistedScore = useAtomValue(scoreAtom);
  const setPersistedScore = useSetAtom(scoreAtom);

  const { authenticated, ready, user, signMessage } = usePrivy();
  const ar = useArweave(user?.wallet?.address, signMessage);

  const [gameEpoch, setGameEpoch] = useState(0);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.ChooseSide);
  const [chosenSide, setChosenSide] = useState<PlayerSide>();
  const [score, setScore] = useState<number>(0);
  const [updatedScoreDelta, setUpdatedScoreDelta] = useState<number>(0);
  const [isOnSpice, setIsOnSpice] = useState(false);
  const [epochScore, setEpochScore] = useState(0);

  const updatedScoreDeltaRef = useRef(updatedScoreDelta);

  const floatieRef = useFloatie(
    // @ts-ignore
    (cb) =>
      cb(
        updatedScoreDeltaRef.current > 90
          ? `${updatedScoreDeltaRef.current}!!!`
          : `${updatedScoreDeltaRef.current}`,
        updatedScoreDeltaRef.current > 90 ? ["color:#ffe735"] : ["color:#53FFD8"]
      ),
    !!updatedScoreDelta
  );

  useEffect(() => {
    setGameEpoch(getCurrentEpoch());

    chooseWorm();
  }, []);

  useEffect(() => {
    authenticated && ready && user?.wallet?.address && ar.auth(user?.wallet?.address, signMessage);
  }, [authenticated, ready, user, signMessage]);

  // useEffect(() => {
  //   chosenSide !== undefined &&
  //     // @ts-ignore
  //     (setPhase(GamePhase.Active), ar.auth(user?.wallet?.address, signMessage));
  // }, [chosenSide]);

  useEffect(() => {
    isOnSpice && setTimeout(() => setIsOnSpice(false), 3000);
  }, [isOnSpice]);

  useEffect(() => {
    score &&
      (setPersistedScore(score),
      setDebouncedScore(score),
      setGlobalScore(globalScore + updatedScoreDeltaRef.current)),
      setEnergy(energy - updatedScoreDeltaRef.current);
    // setEpochScore((oldValue) => oldValue + updatedScoreDeltaRef.current));
  }, [score]);

  // useEffect(() => {
  //   setEpochScore(0);
  // }, [currentEpoch]);

  useEffect(() => {}, [epochScore]);

  useEffect(() => {
    debouncedScore && commitScore(debouncedScore);
  }, [debouncedScore]);

  const commitScore = (score: number) => {
    ar.write({
      function: "commit",
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
    Math.random() > 0.98 && setIsOnSpice(true);

    // @ts-ignore
    handleTap(isOnSpice ? 100 : 10, isOnSpice && "heavy");
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
      // style={{
      //   background: isOnSpice
      //     ? "linear-gradient(#0500FF,#000000)"
      //     : "linear-gradient(#FF6B00,#FAFF00)",
      // }}
    >
      {/* <motion.img
        src={"/cloudy.png"}
        animate={{ right: ["-120%", "120%"] }}
        transition={{ repeatType: "mirror", repeat: Infinity, duration: 4, type: "just", delay: 2 }}
        style={{
          position: "fixed",
          top: "10%",
        }}
      ></motion.img> */}
      <Image
        src={"/orb.png"}
        width={["12rem", "min(100%, 15rem)"]}
        maxWidth={"25vh"}
        // maxHeight={"30%"}
        style={{
          position: "fixed",
          top: "8rem",
          borderRadius: "1000px",
          transition: ".2s",
          boxShadow: "rgb(133 255 100 / 40%) 0px 0px 50px",
          // transform: `rotateZ(${score % 3 > 1 ? -10 : 10}deg)`,
        }}
      ></Image>

      <Image
        src={"/pfp.png"}
        width={["12rem", "min(100%, 15rem)"]}
        maxWidth={"25vh"}
        style={{
          position: "fixed",
          bottom: "10.5rem",
          borderRadius: "1000px",
          // background: "linear-gradient(to bottom, #00000082, #39e6c9) border-box",
          boxShadow: "0 0 50px #00ffd43d",

          border: "2px solid #aeffef",
          transition: ".2s",
        }}
      ></Image>

      <Flex
        flexDirection={"column"}
        alignItems={"center"}
        style={{
          position: "fixed",
          top: "1.5rem",
        }}
      >
        <Text
          fontWeight={700}
          mb={".5rem"}
          fontSize={"1.75rem"}
          style={{
            background: "linear-gradient(#53FFD8, #02B1AA)",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          ORB OF CHAOS
        </Text>
        <svg
          width="389"
          style={{ maxWidth: "90%" }}
          height="26"
          viewBox="0 0 389 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M25 8.50943C25 8.22808 25.2281 8 25.5094 8H357.509C362.199 8 366 11.8014 366 16.4906C366 16.7719 365.772 17 365.491 17H33.4906C28.8014 17 25 13.1986 25 8.50943Z"
            fill="url(#paint0_linear_360_249)"
          />
          <path d="M0 0H1C1 14.3594 12.1929 26 26 26C11.6406 26 0 14.3594 0 0Z" fill="#53FFD8" />
          <path
            d="M389 26H388C388 11.6406 376.807 0 363 0C377.359 0 389 11.6406 389 26Z"
            fill="#53FFD8"
          />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M386 26C386 25.6651 385.994 25.3318 385.981 25C385.456 11.104 374.025 0 360 0H3C3 0.334849 3.00633 0.668221 3.01888 1C3.54438 14.896 14.9754 26 29 26H386ZM360 1C373.472 1 384.455 11.6565 384.98 25H29C15.5278 25 4.54454 14.3435 4.01963 1H360Z"
            fill="#53FFD8"
          />
          <defs>
            <linearGradient
              id="paint0_linear_360_249"
              x1="0"
              y1="13"
              x2="389"
              y2="13"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset={(1e7 - (globalScore || 1)) / 1e7} stop-color="#00FF94" />
              <stop offset="0" stop-color="#00C572" stop-opacity="0.39" />
            </linearGradient>
          </defs>
        </svg>
        <Text
          color={"#6EFEC2"}
          opacity={0.75}
          fontWeight={500}
          // marginTop={"-3.75rem"}
          fontSize={"1rem"}
          // style={{ "-webkit-text-stroke-width": "1px", "-webkit-text-stroke-color": "black" }}
        >
          {1e7 - globalScore} / {1e7}
        </Text>
      </Flex>
      {/* <Flex
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
      </Flex> */}
      {/* <Flex
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
      </Flex> */}
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
      {/* <Image
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
      ></Image> */}
      <Footer />
    </Flex>
  );
}
