"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuList,
  ScaleFade,
  Spinner,
  Text,
  useBoolean,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import useArweave from "@/features/useArweave";
import { usePrivy } from "@privy-io/react-auth";
import useWallet from "@/features/useAccount";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { AnimatedCounter } from "@/components/Counter";
import {
  arContractStateAtom,
  debouncedEnergyAtom,
  debouncedEnergyAtomValue,
  energyAtom,
  persistedGlobalScoreAtom,
  persistedPlayerScoreAtom,
  persistedPlayerStateAtom,
  persistedStateAtom,
} from "@/state";
import { TNode } from "@/features/useBubbleMap";
import { ENERGY_RESTORE_PER_SECOND, MAX_ENERGY } from "@/const";
import atomWithDebounce from "@/atoms/debouncedAtom";
import { ChevronLeftIcon, HamburgerIcon } from "@chakra-ui/icons";

const { debouncedValueAtom: debouncedScoreAtom, currentValueAtom: debouncedScoreAtomValue } =
  atomWithDebounce(0);

export default function Page() {
  enum EStage {
    initial,
    game,
  }

  enum EProcess {
    checkingIn,
    inviting,
    depleted,
  }

  const [gangsMap, setGangsMap] = useState<TNode[]>();

  const [processes, setProcesses] = useState<EProcess[]>([]);
  const [stage, setStage] = useState<EStage>(EStage.initial);

  const router = useRouter();
  const { ready, user, login, authenticated, logout } = usePrivy();
  const { signFn } = useWallet();
  const {
    ready: arReady,
    readState,
    auth,
    read,
    write,
    arWallet,
  } = useArweave(user?.wallet?.address);

  const [persistedPlayerState, setPersistedPlayerState] = useAtom(persistedPlayerStateAtom);
  // const persistedPlayerState = {}
  const [arContractState, setArContractState] = useAtom(arContractStateAtom);

  // @ts-ignore
  const currentGangId = persistedPlayerState?.currentGang;
  const oppositeGangId = router.query.id;

  const [currentGang, setCurrentGang] = useState<{ image: string }>();
  const [oppositeGang, setOppositeGang] = useState<{ image: string }>();

  const [lastCheckin, setLastCheckin] = useState<number>();

  const [checkinAmount, setCheckinAmount] = useState<number>();
  const [hasCheckedIn, setHasCheckedIn] = useState<Boolean>();
  const [nextCheckinTime, setNextCheckinTime] = useState<string>();

  const persistedGlobalScore = useAtomValue(persistedGlobalScoreAtom);
  const [persistedPlayerScore, setPersistedPlayerScore] = useAtom(persistedPlayerScoreAtom);

  const [clientPlayerScore, setClientPlayerScore] = useState<number>();
  const [updatedScoreDelta, setUpdatedScoreDelta] = useState<number>(0);
  const updatedScoreDeltaRef = useRef(updatedScoreDelta);

  const debouncedScore = useAtomValue(debouncedScoreAtom);
  const setDebouncedScore = useSetAtom(debouncedScoreAtom);

  const debouncedEnergy = useAtomValue(debouncedEnergyAtom);
  const debouncedCurrentEnergy = useAtomValue(debouncedEnergyAtomValue);

  const [energy, setEnergy] = useAtom(energyAtom);

  const [localEnergy, setLocalEnergy] = useState<number>();
  const [spentEnergy, setSpentEnergy] = useState<number>(0);

  const stolenEnergy = spentEnergy * 0.15;

  const [gangMetadata, setGangMetadata] = useState<{
    [gangId: string]: { name: string; ticker: string; image: string };
  }>();

  const [restoredEnergy, setRestoredEnergy] = useState(0);

  const persistedState = useAtomValue(persistedStateAtom);

  const [scoreAnimationToggle, setScoreAnimationToggle] = useBoolean();

  const energyRef = useRef<number | undefined>(energy);
  const checkinTimerInterval = useRef<any>();
  const gangsMapRef = useRef<any>();
  const lastBubblePopTimestampRef = useRef<number>();

  const canPlay = authenticated && arReady;

  useEffect(() => {
    setLocalEnergy(energy);
  }, []);

  useEffect(() => {
    // @ts-ignore
    persistedState && setGangsMap(Object.values(persistedState.gangs));
  }, [persistedState]);

  useEffect(() => {
    ready &&
      user?.wallet?.address &&
      authenticated &&
      signFn &&
      auth(user?.wallet?.address!, signFn);
  }, [ready, user, authenticated, signFn]);

  useEffect(() => {
    oppositeGang &&
      //@ts-ignore
      fetch(`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}ipfs/${oppositeGang.metadata}`)
        .then((res) => res.json())
        //@ts-ignore
        .then((metadata) => setGangMetadata((old) => ({ ...old, [oppositeGang.id]: metadata })));
  }, [oppositeGang]);

  useEffect(() => {
    currentGang &&
      //@ts-ignore
      fetch(`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}ipfs/${currentGang.metadata}`)
        .then((res) => res.json())
        //@ts-ignore
        .then((metadata) => setGangMetadata((old) => ({ ...old, [currentGang.id]: metadata })));
  }, [currentGang]);

  useEffect(() => {
    gangsMapRef.current = gangsMap;

    // @ts-ignore
    gangsMap && setOppositeGang(gangsMap.filter(({ id }) => id == oppositeGangId)[0]);
  }, [gangsMap, oppositeGangId]);

  useEffect(() => {
    energyRef.current = energy;
  }, [energy]);

  useEffect(() => {
    // @ts-ignore
    setLastCheckin(persistedPlayerState?.checkins?.[currentGangId]?.last);
    // @ts-ignore
    setCheckinAmount(persistedPlayerState?.checkins?.[currentGangId]?.amount || 0);
    // @ts-ignore
    persistedPlayerState?.currentGang &&
      setTimeout(
        // @ts-ignore
        () => setClientPlayerScore(persistedPlayerState?.score?.[currentGangId]?.value || 0),
        800
      );
  }, [persistedPlayerState]);

  useEffect(() => {
    gangsMap &&
      persistedPlayerState &&
      setCurrentGang(
        // @ts-ignore
        gangsMapRef.current.filter(({ id }) => id == persistedPlayerState?.currentGang)[0]
      );
  }, [persistedPlayerState, gangsMap]);

  useEffect(() => {
    debouncedScore && commitScore(debouncedScore);
  }, [debouncedScore]);

  // useEffect(() => {
  //   +localEnergy! < MAX_SCORE / 100 &&
  //     (setProcess([...process, EProcess.depleted]),
  //     setTimeout(() => setProcess(without(process, EProcess.depleted)), 2000));
  // }, [localEnergy]);

  useEffect(() => {
    arReady && readState().then((value) => setArContractState(value?.cachedValue?.state as {}));
  }, [arReady]);

  useEffect(() => {
    ready && user?.wallet?.address && signFn && auth(user?.wallet?.address!, signFn);
  }, [ready, user, signFn]);

  useEffect(() => {
    clientPlayerScore && setDebouncedScore(clientPlayerScore);
  }, [clientPlayerScore]);

  const commitScore = (score: number) => {
    write({
      function: "score",
      score,
      id: currentGangId,
      opponent: oppositeGangId,
      // @ts-ignore
    });
    // }).then(() => setPersistedPlayerScore({ ...persistedPlayerScore, [currentGangId]: { value: score, value: score } }));
  };

  const pump = (value: number = 200) => {
    if (energy && energy < value) {
      return;
    }

    setSpentEnergy(spentEnergy + value);

    setScoreAnimationToggle.toggle();

    setClientPlayerScore((old) => (old || 0) + value);
    // @ts-ignore
    setEnergy((old) => old! - value);
    setLocalEnergy((old) => old! - value);

    // @ts-ignore
    global.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
  };

  return (
    <Flex width={"100%"} flexDirection={"column"} alignItems={"center"} padding={"1rem"}>
      <Flex justifyContent={"center"}>
        <ScaleFade in={!!currentGang}>
          <Flex justify={"center"}>
            <Flex
              bottom={"7rem"}
              pos={"fixed"}
              width={["80vw", "min(100%, 15rem)"]}
              height={["80vw", "min(100%, 15rem)"]}
              maxWidth={"45vh"}
              align={"center"}
              justify={"center"}
            >
              <Image
                style={{
                  transition: ".2s",
                  transform: `scale(${scoreAnimationToggle ? 1 : 1.1})`,
                }}
                // @ts-ignore
                src={`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}ipfs/${gangMetadata?.[currentGangId]?.image}`}
                margin={"0 auto"}
                width={["50%"]}
                borderRadius={"full"}
                boxShadow={"0 0 100px green"}
              ></Image>
              {/* <Flex pos={"absolute"} justifyContent={"center"} align={"center"} w={"95%"}>
                <AnimatePresence>
                  {currentGang && (
                    <motion.div
                      initial={{ rotateZ: 0, scale: 0 }}
                      animate={{ rotateZ: 360, scale: 1 }}
                      style={{ maxWidth: "100%", display: "flex" }}
                    >
                      <CircularRim
                        style={{
                          transform: `rotateZ(${scoreAnimationToggle ? 0 : 20}deg)`,
                          transition: ".2s",
                        }}
                      ></CircularRim>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Flex> */}
            </Flex>
          </Flex>
        </ScaleFade>
        <ScaleFade in={!!oppositeGang}>
          <Flex justify={"center"}>
            <Flex
              top={"2rem"}
              pos={"fixed"}
              width={["60vw", "min(100%, 15rem)"]}
              height={["60vw", "min(100%, 15rem)"]}
              maxWidth={"20vh"}
              align={"center"}
              justify={"center"}
            >
              <CircularProgress
                value={energy ? 100 - (100 * (MAX_ENERGY - energy)) / MAX_ENERGY : 0}
                color="red"
                w={"100%"}
                h={"100%"}
                size={"100%"}
              >
                <CircularProgressLabel>
                  <Image
                    style={{
                      transition: ".2s",
                      transform: `scale(${scoreAnimationToggle ? 1.1 : 1})`,
                    }}
                    // @ts-ignore
                    src={`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}ipfs/${
                      // @ts-ignore
                      gangMetadata?.[oppositeGang.id]?.image
                    }`}
                    filter={`grayscale(${energy ? (MAX_ENERGY - energy) / MAX_ENERGY : 0})`}
                    margin={"0 auto"}
                    width={["80%"]}
                    borderRadius={"full"}
                    boxShadow={"0 0 100px red"}
                    zIndex={1}
                  ></Image>
                </CircularProgressLabel>
              </CircularProgress>
              {/* <Flex pos={"absolute"} justifyContent={"center"} align={"center"} w={"100%"}>
                <AnimatePresence>
                  {oppositeGang && currentGangId && (
                    <motion.div
                      initial={{ rotateZ: 0, scale: 0 }}
                      animate={{ rotateZ: 90, scale: 1 }}
                      style={{
                        width: "100%",
                        display: "flex",
                        zIndex: 0,
                      }}
                    >
                      <TargetIcon
                        style={{ width: "100%", height: "100%", fill: "red" }}
                      ></TargetIcon>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Flex> */}
            </Flex>
          </Flex>
        </ScaleFade>
        <span
          onMouseDown={() => pump()}
          style={{
            userSelect: "none",
            position: "fixed",
            width: "100%",
            height: "100vh",
            bottom: 0,
            zIndex: 1,
          }}
        ></span>
      </Flex>
      <Flex
        flexDir={"column"}
        gap={"1rem"}
        w={"100%"}
        height={"calc(100svh - 2rem)"}
        pos={"relative"}
        alignItems={"center"}
      >
        <Flex
          flexDir={"column"}
          gap={"1.5rem"}
          alignItems={"center"}
          pos={"absolute"}
          bottom={"2rem"}
          zIndex={1}
          w={"100%"}
        >
          <AnimatePresence>
            {stage === EStage.initial && persistedPlayerState && currentGangId ? (
              <></>
            ) : (
              <motion.div
                initial={{ y: 300, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -300, opacity: 0 }}
                transition={{ delay: 0.2 }}
              >
                {persistedPlayerState ? (
                  <Button
                    onClick={() =>
                      router.push({
                        // @ts-ignore
                        pathname: `/[vendor]/gangs`,
                        query: { vendor: router.query.vendor || "main" },
                      })
                    }
                    variant={"accent"}
                    w={"100%"}
                  >
                    GANG UP
                  </Button>
                ) : ready && !authenticated ? (
                  <Button onClick={login} variant={"accent"} w={"100%"}>
                    CONNECT
                  </Button>
                ) : (
                  <Spinner />
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <Flex w={"100%"} alignItems={"center"} justifyContent={"space-between"} px={".5rem"}>
            <ScaleFade in>
              <IconButton
                onClick={() =>
                  router.push({
                    // @ts-ignore
                    pathname: `/[vendor]/gang/${currentGangId}`,
                    query: { vendor: router.query.vendor || "main" },
                  })
                }
                aria-label="back"
                icon={<ChevronLeftIcon boxSize={10}></ChevronLeftIcon>}
                variant={"unstyled"}
                color={"fg"}
              />
            </ScaleFade>
            <Flex
              gap={".5rem"}
              w={"100%"}
              justifyContent={"center"}
              flexDir={"column"}
              align={"center"}
            >
              <ScaleFade in={clientPlayerScore !== undefined}>
                <AnimatedCounter value={clientPlayerScore} color="white" fontSize="2rem" />
              </ScaleFade>

              <Flex flexDir={"column"} gap={".25rem"} alignItems={"center"}>
                <Flex gap={".25rem"} alignItems={"center"}>
                  <ScaleFade in={energy !== undefined}>
                    <Text fontWeight={"bold"} opacity={0.8} color={"fg"}>
                      Energy {Math.round(energy!)} ({ENERGY_RESTORE_PER_SECOND.toFixed(1)} p/s)
                    </Text>
                  </ScaleFade>
                </Flex>
              </Flex>
            </Flex>
            <ScaleFade in>
              <Menu>
                <MenuButton
                  p={".5rem"}
                  bg={"transparent"}
                  border={"2px solid #ffffff70"}
                  height={"3rem"}
                  justifyContent={"center"}
                  alignContent={"center"}
                  w={"3rem"}
                  borderRadius={"full"}
                  flexDir={"row"}
                  display={"flex"}
                  gap={".5rem"}
                >
                  <HamburgerIcon boxSize={6} color={"fg"} />
                </MenuButton>
                <MenuList
                  bg={"#ffffffbf"}
                  p={"1rem"}
                  borderRadius={"xl"}
                  border={"1px solid #F0F0F0"}
                  backdropFilter={"blur(15px)"}
                  justifyContent={"space-between"}
                >
                  <Flex justifyContent={"space-between"}>
                    <Button
                      onClick={logout}
                      bg={"black"}
                      p={"1rem"}
                      w={"5rem"}
                      h={"5rem"}
                      _hover={{ bg: "black" }}
                    >
                      <Flex flexDir={"column"} gap={".5rem"} align={"center"}>
                        <Text
                          lineHeight={"1rem"}
                          fontWeight={"bold"}
                          // fontSize={process.includes(EProcess.inviting) ? ".75rem" : "1rem"}
                        >
                          Logout
                        </Text>
                      </Flex>
                    </Button>
                  </Flex>
                </MenuList>
              </Menu>
            </ScaleFade>
          </Flex>
        </Flex>
      </Flex>
      <ScaleFade
        in={energy !== undefined && energy < 1000}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backdropFilter: "blur(100px)",
          zIndex: energy !== undefined && energy < 1000 ? 2 : 0,
        }}
      >
        <Flex
          pos={"fixed"}
          w={"100vw"}
          h={"100vh"}
          top={0}
          left={0}
          flexDir={"column"}
          justify={"center"}
          align={"center"}
          gap={"10vh"}
        >
          <Flex flexDir={"column"} gap={"1rem"}>
            {!!spentEnergy && (
              <Flex flexDir={"column"}>
                <Text fontSize={"3rem"} fontWeight={"bold"}>
                  {spentEnergy || 0}
                </Text>
                <Text>AP EARNED</Text>
              </Flex>
            )}
            {!!stolenEnergy && (
              <Flex flexDir={"column"}>
                <Text fontSize={"3rem"} fontWeight={"bold"}>
                  {stolenEnergy || 0}
                </Text>
                <Text>AP STOLEN</Text>
              </Flex>
            )}
          </Flex>
          <Flex flexDir={"column"} gap={".25rem"}>
            <Button
              onClick={() =>
                router.push({
                  // @ts-ignore
                  pathname: `/[vendor]/gang/${currentGangId}`,
                  query: { vendor: router.query.vendor || "main" },
                })
              }
            >
              chill
            </Button>
            <Text fontSize={".75rem"} opacity={0.5}>
              full energy every 60m
            </Text>
          </Flex>
        </Flex>
      </ScaleFade>
    </Flex>
  );
}
