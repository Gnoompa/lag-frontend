"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Flex, Image, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import useArweave from "@/features/useArweave";
import { without } from "lodash";
import { usePrivy } from "@privy-io/react-auth";
import useWallet from "@/features/useWallet";
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
} from "@/state";
import useBubbleMap, { TNode } from "@/features/useBubbleMap";
import { ERC20_TOKENS, GANGS, MAX_SCORE_PER_MIN } from "@/const";
import atomWithDebounce from "@/atoms/debouncedAtom";

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

  const bubbleMap = useBubbleMap(gangsMap);

  const [process, setProcess] = useState<EProcess[]>([]);
  const [stage, setStage] = useState<EStage>(EStage.initial);

  const router = useRouter();
  const { ready, user, login, authenticated } = usePrivy();
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
  const currentGangId = persistedPlayerState?.currentGuild;

  const [lastCheckin, setLastCheckin] = useState<number>();

  const [checkinAmount, setCheckinAmount] = useState<number>();
  const [hasCheckedIn, setHasCheckedIn] = useState<Boolean>();
  const [nextCheckinTime, setNextCheckinTime] = useState<string>();

  const persistedGlobalScore = useAtomValue(persistedGlobalScoreAtom);
  const setPersistedPlayerScore = useSetAtom(persistedPlayerScoreAtom);

  const [clientPlayerScore, setClientPlayerScore] = useState<number>();
  const [updatedScoreDelta, setUpdatedScoreDelta] = useState<number>(0);
  const updatedScoreDeltaRef = useRef(updatedScoreDelta);

  const debouncedScore = useAtomValue(debouncedScoreAtom);
  const setDebouncedScore = useSetAtom(debouncedScoreAtom);

  const debouncedEnergy = useAtomValue(debouncedEnergyAtom);
  const debouncedCurrentEnergy = useAtomValue(debouncedEnergyAtomValue);

  const [energy, setEnergy] = useAtom(energyAtom);

  const [localEnergy, setLocalEnergy] = useState<number>();
  const [restoredEnergy, setRestoredEnergy] = useState(0);

  const checkinTimerInterval = useRef<any>();
  const gangsMapRef = useRef<any>();

  useEffect(() => {
    setLocalEnergy(energy);
    // setInterval(() =>
    //   setGangsMap([...(gangsMapRef.current || []), { value: 20, image: "/bubble1.png" }]), 2000
    // );
  }, []);

  useEffect(() => {
    gangsMapRef.current = gangsMap;
  }, [gangsMap]);

  useEffect(() => {
    // @ts-ignore
    setLastCheckin(persistedPlayerState?.checkins?.[currentGangId]?.last);
    // @ts-ignore
    setCheckinAmount(persistedPlayerState?.checkins?.[currentGangId]?.amount || 0);
    // @ts-ignore
    persistedPlayerState?.score?.[currentGangId]?.score &&
      setTimeout(
        // @ts-ignore
        () => setClientPlayerScore(persistedPlayerState?.score?.[currentGangId]?.score),
        800
      );
  }, [persistedPlayerState]);

  useEffect(() => {
    persistedGlobalScore &&
      setGangsMap(
        ERC20_TOKENS.map((token) => ({
          ...token,
          // @ts-ignore
          value: persistedGlobalScore[token.id] || 0,
        }))
      );
  }, [persistedGlobalScore]);

  useEffect(() => {
    setLocalEnergy(debouncedEnergy);
  }, [debouncedEnergy]);

  useEffect(() => {
    debouncedScore && commitScore(debouncedScore);
  }, [debouncedScore]);

  useEffect(() => {
    +localEnergy! < MAX_SCORE_PER_MIN / 100 &&
      (setProcess([...process, EProcess.depleted]),
      setTimeout(() => setProcess(without(process, EProcess.depleted)), 2000));
  }, [localEnergy]);

  useEffect(() => {
    clearInterval(checkinTimerInterval.current);

    lastCheckin ? initCheckin() : setHasCheckedIn(false);
  }, [lastCheckin]);

  useEffect(() => {
    arReady && readState().then((value) => setArContractState(value?.cachedValue?.state as {}));
  }, [arReady]);

  // useEffect(() => {
  //   return () => htmlSvgElement?.remove();
  // }, [htmlSvgElement]);

  useEffect(() => {
    ready && user?.wallet?.address && signFn && auth(user?.wallet?.address!, signFn);
  }, [ready, user, signFn]);

  useEffect(() => {
    clientPlayerScore && (setEnergy(energy - 10), setDebouncedScore(clientPlayerScore));
  }, [clientPlayerScore]);

  const commitScore = (score: number) => {
    write({
      function: "commitScore",
      score,
      id: currentGangId,
    }).then(() => setPersistedPlayerScore(score));
  };

  const initCheckin = () => {
    checkinTimerInterval.current = setInterval(
      () => (
        setHasCheckedIn(lastCheckin ? Date.now() / 1000 - lastCheckin < 24 * 60 * 60 - 1 : false),
        setNextCheckinTime(
          lastCheckin
            ? ((date): string =>
                // @ts-ignore
                [~~(date / 60), ~~date].reduce(
                  (a, b, i) =>
                    // @ts-ignore
                    +a ? `${a}${["h", "m", "s"][i]}` : i == 1 && !a ? `${b}s` : i == 0 ? b : a,
                  ~~(date / (60 * 60))
                ))(24 * 60 * 60 - (+Date.now() / 1000 - lastCheckin))
            : undefined
        )
      ),
      1000
    );
  };

  const checkin = () => {
    setProcess([...process, EProcess.checkingIn]);

    write({ function: "checkin", guild: currentGangId })
      .then(() => (setLastCheckin(+Date.now() / 1000), setCheckinAmount(checkinAmount! + 1)))
      .catch(() => alert("Oops, smth went wrong..."))
      .finally(() => setProcess(without(process, EProcess.checkingIn)));
  };

  const invite = () => {
    setProcess([...process, EProcess.inviting]);

    setTimeout(() => setProcess(without(process, EProcess.inviting)), 2000);

    navigator.clipboard.writeText(`${location.origin}/?i=${arWallet?.address}`);
  };

  const pump = () => {
    // simulation.nodes().map(node => node.radius = 10)
    // node.nodes().map(node => (node.setAttribute("width", 100)))

    setClientPlayerScore((clientPlayerScore || 0) + 10);
    setEnergy((old) => old! - 10);
    setLocalEnergy((old) => old! - 10);

    // @ts-ignore
    global.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
  };

  return (
    <Flex width={"100%"} flexDirection={"column"} alignItems={"center"} padding={"1rem"}>
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
        >
          {/* <AnimatePresence>
            {stage === EStage.initial && persistedPlayerState && currentGangId ? (
              <Flex gap={"1.5rem"}>
                <motion.div
                  initial={{ y: 300, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -300, opacity: 0 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <Button
                    onClick={invite}
                    variant={"accent"}
                    w={"5rem"}
                    h={"5rem"}
                    flexDir={"column"}
                    gap={".5rem"}
                  >
                    <svg width="1.5rem" height="1.5rem" viewBox="0 0 23 24" fill="none">
                      <path
                        d="M22.8004 13.9999H13.6804V23.1999H9.48039V13.9999H0.400391V10.0799H9.48039V0.879883H13.6804V10.0799H22.8004V13.9999Z"
                        fill="black"
                      />
                    </svg>
                    <Text
                      lineHeight={"1rem"}
                      fontWeight={"bold"}
                      fontSize={process.includes(EProcess.inviting) ? ".75rem" : "1rem"}
                    >
                      {process.includes(EProcess.inviting) ? "link copied" : "invite"}
                    </Text>
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ y: 300, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -300, opacity: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <Button
                    isDisabled={hasCheckedIn === undefined ? true : !!hasCheckedIn}
                    isLoading={process.includes(EProcess.checkingIn)}
                    onClick={checkin}
                    variant={"accent"}
                    w={"5rem"}
                    h={"5rem"}
                    flexDir={"column"}
                    gap={".5rem"}
                  >
                    <AnimatePresence>
                      {hasCheckedIn && (
                        <motion.div
                          initial={{ scale: 0, rotateZ: "90deg" }}
                          animate={{ scale: 1, rotateZ: "0deg" }}
                          exit={{ scale: 0 }}
                          whileHover={{ scale: 1.1, transition: { delay: 0 } }}
                          style={{ width: "4rem", position: "absolute", top: "1rem" }}
                        >
                          <Container variant={"tooltip"} p={".1rem"} bg={"black"}>
                            <Text color={"white"} fontSize={".75rem"}>
                              in {nextCheckinTime}
                            </Text>
                          </Container>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {!hasCheckedIn && (
                        <motion.div
                          initial={{ scale: 0, rotateZ: "90deg" }}
                          animate={{ scale: 1, rotateZ: "0deg" }}
                          exit={{ scale: 0 }}
                          style={{
                            width: "1.5rem",
                            height: "1.5rem",
                            position: "absolute",
                            top: "1rem",
                          }}
                        >
                          <svg width="1.5rem" height="1.5rem" viewBox="0 0 25 24" fill="none">
                            <path
                              d="M25 0C19.4712 6.89109 15.3045 14.8911 12.5 24C9.69551 14.8911 5.52885 6.89109 0 2.16047e-06L6.25 1.62035e-06C8.13301 2.45545 10.2163 5.9604 12.5 10.5149C14.7837 5.9604 16.867 2.45545 18.75 5.40116e-07L25 0Z"
                              fill="black"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <Text mt={"2rem"} fontWeight={"bold"}>
                      checkin
                    </Text>
                    <AnimatePresence>
                      {checkinAmount && (
                        <motion.div
                          initial={{ scale: 0, rotateZ: "90deg" }}
                          animate={{ scale: 1, rotateZ: "0deg" }}
                          exit={{ scale: 0 }}
                          style={{
                            position: "absolute",
                            top: "-1rem",
                            left: "-.75rem",
                          }}
                        >
                          <Container
                            variant={"tooltip"}
                            h={"1.75rem"}
                            p={".1rem .5rem"}
                            fontWeight={"bold"}
                          >
                            {checkinAmount}
                          </Container>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ y: 300, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -300, opacity: 0 }}
                  transition={{ delay: 0.4 }}
                  whileTap={{ scale: 0.9, transition: { delay: 0 } }}
                  whileHover={{ scale: 1.1, transition: { delay: 0 } }}
                >
                  <Container
                    transition={".1s"}
                    bg={`conic-gradient(from ${
                      360 - ((MAX_SCORE_PER_MIN - localEnergy!) / MAX_SCORE_PER_MIN) * 360
                    }deg at 50% 50%, #2F2F2F 0deg, #FFFFFF 360deg)`}
                    borderRadius={"lg"}
                    p={".5rem"}
                  >
                    <Button
                      onClick={pump}
                      w={"4rem"}
                      h={"4rem"}
                      isLoading={process.includes(EProcess.depleted)}
                      _loading={{
                        opacity: 1,
                        bg: "white",
                        _hover: {
                          opacity: 1,
                          bg: "white",
                        },
                      }}
                      flexDir={"column"}
                      bg={"white"}
                      color={"black"}
                      border="1px solid black"
                      variant={"unstyled"}
                      display={"flex"}
                      p={".5rem"}
                      alignItems={"center"}
                      justifyContent={"center"}
                    >
                      <svg width="1.5rem" height="1.5rem" viewBox="0 0 35 34" fill="none">
                        <path
                          d="M4.9957 1.04455L4.20547 2.08097L3.74883 2.98548C3.49453 3.48351 3.19102 4.09459 3.06797 4.34764C2.83828 4.82681 2.81094 4.90758 2.17109 7.1877C2.08359 7.49997 2.06719 7.62381 1.95508 8.82982C1.85391 9.90393 1.83203 10.2404 1.83203 10.7277C1.83203 11.6726 1.93594 12.6175 2.14922 13.6162C2.20117 13.8558 2.24219 14.0604 2.24219 14.0658C2.24219 14.0738 2.29141 14.0712 2.35156 14.0631L2.46094 14.0442V27.8354H0V33.5963H5.63281V27.8354H3.17188V13.8935L3.27578 13.8666C3.33047 13.8531 3.74063 13.7643 4.18359 13.6727C4.62656 13.5785 4.9957 13.5005 4.99844 13.4978C5.00391 13.4951 4.97109 13.3228 4.92461 13.1182C4.76602 12.4183 4.65117 11.4761 4.64844 10.865C4.6457 10.5581 4.67852 10.0843 4.75508 9.2417C4.81797 8.58754 4.86719 8.03299 4.86719 8.01146C4.86719 7.98723 4.88359 7.96838 4.90547 7.96838C4.93828 7.96838 8.04453 8.84059 16.1 11.1073C16.1766 11.1315 16.2422 11.1611 16.2422 11.1773C16.2422 11.1907 15.7691 12.3214 15.1922 13.6835C13.0074 18.8414 9.09453 28.0803 7.8832 30.9312C7.36641 32.1533 6.93984 33.1628 6.93711 33.1736C6.93438 33.1844 7.36914 33.3755 7.90235 33.5963C8.70625 33.9274 8.87578 33.9893 8.89492 33.957C8.9168 33.9193 10.2402 30.7993 11.8344 27.0305C12.2063 26.1529 12.5234 25.4287 12.5398 25.4233C12.5563 25.4153 13.3 25.7195 14.1941 26.0963C15.9988 26.8555 21.4703 29.1571 23.6523 30.0751C24.4262 30.4008 25.0742 30.6808 25.0934 30.697C25.1125 30.7158 25.4352 31.4615 25.8152 32.3579C26.1926 33.2544 26.5043 33.9893 26.507 33.992C26.5098 33.9947 26.95 33.8197 27.4832 33.5989C28.1395 33.3271 28.4484 33.1871 28.443 33.1628C28.4348 33.1278 27.3055 30.4493 21.7246 17.2612C20.527 14.4265 19.5508 12.106 19.5563 12.0979C19.5699 12.0871 25.9438 13.8746 25.9656 13.8989C25.9738 13.9069 25.8918 14.23 25.7852 14.6176C25.6785 15.008 25.5992 15.3337 25.6129 15.3445C25.6238 15.3579 26.7613 15.8021 28.1367 16.3351C31.6148 17.6838 33.1106 18.2653 33.2281 18.3138C33.2856 18.338 33.3375 18.3487 33.343 18.338C33.3484 18.3272 33.3867 18.198 33.4277 18.0499C33.466 17.9019 33.5234 17.6892 33.5535 17.5788C33.5863 17.4685 33.7176 16.9758 33.8516 16.4886C33.9856 15.9986 34.1195 15.5033 34.1523 15.3849C34.1852 15.2664 34.3191 14.7684 34.4531 14.2811C34.7238 13.2824 34.7731 13.102 34.8797 12.7198C34.9891 12.3187 34.9891 12.3348 34.9152 12.3187C34.8797 12.3106 34.5598 12.2541 34.207 12.1948C33.8543 12.1329 33.3676 12.0495 33.127 12.0064C32.8863 11.9633 32.468 11.8906 32.1973 11.8449C31.6914 11.756 31.3086 11.6914 30.1875 11.4949C29.0609 11.2984 28.6809 11.2311 28.1777 11.1449C27.907 11.0992 27.4887 11.0238 27.2508 10.9807C27.0102 10.9404 26.8106 10.9081 26.8078 10.9107C26.8051 10.9134 26.7586 11.0857 26.7012 11.293C26.5535 11.8395 26.5453 11.8718 26.5207 11.8718C26.5098 11.8718 24.0488 11.1799 21.0492 10.3347C18.0523 9.49206 13.3164 8.15682 10.5273 7.37345C7.73828 6.58738 5.45234 5.9413 5.44688 5.93861C5.41953 5.909 5.62734 5.44867 6.05391 4.60876L6.55703 3.6208L7.29805 2.6436C7.70547 2.10789 8.03906 1.66371 8.03906 1.65563C8.03906 1.64756 5.8707 0.0565851 5.81055 0.021589C5.79688 0.0135133 5.42774 0.473844 4.9957 1.04455ZM19.0422 16.354C19.7695 18.0715 20.3574 19.4848 20.3465 19.4928C20.3219 19.5198 13.9727 22.0179 13.9727 22.0018C13.9727 21.9937 14.7137 20.2412 15.616 18.1065C16.5211 15.9744 17.3605 13.9931 17.4809 13.705C17.6039 13.417 17.7051 13.1936 17.7106 13.207C17.716 13.2205 18.3148 14.6365 19.0422 16.354ZM22.5695 24.6857C23.3242 26.4705 23.934 27.9323 23.9258 27.935C23.9176 27.9404 22.5586 27.3723 20.9043 26.6778C19.25 25.9806 17.1555 25.1003 16.2504 24.718C15.3426 24.3385 14.6043 24.0208 14.6043 24.0127C14.6043 23.9912 21.1203 21.4284 21.1586 21.4365C21.1805 21.4392 21.7848 22.8336 22.5695 24.6857Z"
                          fill="black"
                        />
                      </svg>
                      pump
                    </Button>
                  </Container>
                </motion.div>
              </Flex>
            ) : (
              <motion.div
                initial={{ y: 300, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -300, opacity: 0 }}
                transition={{ delay: 0.2 }}
              >
                {persistedPlayerState ? (
                  <Button onClick={() => router.push("/gangs")} variant={"accent"} w={"100%"}>
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
          </AnimatePresence> */}
          <AnimatePresence>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ height: "2rem" }}>
              {clientPlayerScore && (
                <AnimatedCounter
                  value={clientPlayerScore}
                  color="#fff"
                  fontSize="2rem"
                ></AnimatedCounter>
              )}
            </motion.div>
          </AnimatePresence>
          <Flex>
            <AnimatePresence>
              {currentGangId && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <Button
                    onClick={() => router.push("/gangs")}
                    variant={"unstyled"}
                    p={".25rem 1rem .25rem .25rem"}
                    bg={"white"}
                    height={"auto"}
                    borderRadius={"full"}
                    flexDir={"row"}
                    display={"flex"}
                    gap={".5rem"}
                  >
                    <Image
                      src={GANGS.filter(({ id }) => id === currentGangId)[0].image}
                      w={"2rem"}
                    ></Image>
                    <Text color={"black"} fontWeight={"bold"}>
                      {GANGS.filter(({ id }) => id === currentGangId)[0].name}
                    </Text>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
