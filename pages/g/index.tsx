"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Container,
  Flex,
  Image,
  Menu,
  MenuButton,
  MenuList,
  Spinner,
  Text,
} from "@chakra-ui/react";
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
import { ENERGY_RESTORE_PER_SECOND, ERC20_TOKENS, GANGS } from "@/const";
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
  const currentGangId = persistedPlayerState?.currentGang;

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

  // const energyRef = useRef<number>(energy);
  const checkinTimerInterval = useRef<any>();
  const gangsMapRef = useRef<any>();
  const lastBubblePopTimestampRef = useRef<number>();

  const canPlay = authenticated && arReady;

  const { render, unmount } = useBubbleMap(gangsMap, {
    height: global.innerHeight * (canPlay ? 0.7 : 0.8),
  });

  useEffect(() => {
    setLocalEnergy(energy);

    return unmount;
  }, []);

  useEffect(() => {
    gangsMapRef.current = gangsMap;
  }, [gangsMap]);

  // useEffect(() => {
  //   energyRef.current = energy;
  // }, [energy]);

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
      setGangsMap([
        ...ERC20_TOKENS.map((token) => ({
          ...token,
          // @ts-ignore
          value: persistedGlobalScore[token.id] || token.value,
        })),
      ]);
  }, [persistedGlobalScore]);

  useEffect(() => {
    // console.log(debouncedEnergy);
    setLocalEnergy(energy);
  }, [energy]);

  useEffect(() => {
    debouncedScore && commitScore(debouncedScore);
  }, [debouncedScore]);

  // useEffect(() => {
  //   +localEnergy! < MAX_SCORE_PER_MIN / 100 &&
  //     (setProcess([...process, EProcess.depleted]),
  //     setTimeout(() => setProcess(without(process, EProcess.depleted)), 2000));
  // }, [localEnergy]);

  useEffect(() => {
    clearInterval(checkinTimerInterval.current);

    lastCheckin ? initCheckin() : setHasCheckedIn(false);
  }, [lastCheckin]);

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

  const startBubbleSpawning = () => {
    setInterval(
      () => {
        const rnd = ~~(Math.random() * 3) + 1;

        gangsMapRef.current.length < 10 &&
          (lastBubblePopTimestampRef.current
            ? Date.now() - lastBubblePopTimestampRef.current > 1000
            : true) &&
          setGangsMap([
            ...(gangsMapRef.current || []),
            {
              id: Date.now(),
              relativeSize: 0.06,
              value: [0, 10, 20, 100][rnd],
              poppable: true,
              image: `/candle${rnd}.png`,
              onPop: function (node: TNode) {
                // if (energyRef.current < node.value) {
                //   return;
                // }

                (lastBubblePopTimestampRef.current = +Date.now()),
                  // @ts-ignore
                  setGangsMap(
                    without(
                      gangsMapRef.current,
                      gangsMapRef.current?.filter((_node: TNode) => _node.id == node.id)[0]
                    ) || []
                  ),
                  pump(node.value);
              },
            },
          ]);
      },

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

  const beef = () => {
    router.push("/beef")
  };

  const pump = (value: number = 100) => {
    setClientPlayerScore((old) => (old || 0) + value);
    setEnergy((old) => old! - value);
    setLocalEnergy((old) => old! - value);

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
          w={"100%"}
        >
          <AnimatePresence>
            {stage === EStage.initial && persistedPlayerState && currentGangId ? (
              <></>
            ) : (
              // <Flex gap={"1.5rem"}>
              //   <motion.div
              //     initial={{ y: 300, opacity: 0 }}
              //     animate={{ y: 0, opacity: 1 }}
              //     exit={{ y: -300, opacity: 0 }}
              //     whileHover={{ scale: 1.1 }}
              //   >
              //     <Button
              //       onClick={invite}
              //       variant={"accent"}
              //       w={"5rem"}
              //       h={"5rem"}
              //       flexDir={"column"}
              //       gap={".5rem"}
              //     >
              //       <svg width="1.5rem" height="1.5rem" viewBox="0 0 23 24" fill="none">
              //         <path
              //           d="M22.8004 13.9999H13.6804V23.1999H9.48039V13.9999H0.400391V10.0799H9.48039V0.879883H13.6804V10.0799H22.8004V13.9999Z"
              //           fill="black"
              //         />
              //       </svg>
              //       <Text
              //         lineHeight={"1rem"}
              //         fontWeight={"bold"}
              //         fontSize={process.includes(EProcess.inviting) ? ".75rem" : "1rem"}
              //       >
              //         {process.includes(EProcess.inviting) ? "link copied" : "invite"}
              //       </Text>
              //     </Button>
              //   </motion.div>
              //   <motion.div
              //     initial={{ y: 300, opacity: 0 }}
              //     animate={{ y: 0, opacity: 1 }}
              //     exit={{ y: -300, opacity: 0 }}
              //     transition={{ delay: 0.2 }}
              //     whileHover={{ scale: 1.1 }}
              //   >
              //     <Button
              //       isDisabled={hasCheckedIn === undefined ? true : !!hasCheckedIn}
              //       isLoading={process.includes(EProcess.checkingIn)}
              //       onClick={checkin}
              //       variant={"accent"}
              //       w={"5rem"}
              //       h={"5rem"}
              //       flexDir={"column"}
              //       gap={".5rem"}
              //     >
              //       <AnimatePresence>
              //         {hasCheckedIn && (
              //           <motion.div
              //             initial={{ scale: 0, rotateZ: "90deg" }}
              //             animate={{ scale: 1, rotateZ: "0deg" }}
              //             exit={{ scale: 0 }}
              //             whileHover={{ scale: 1.1, transition: { delay: 0 } }}
              //             style={{ width: "4rem", position: "absolute", top: "1rem" }}
              //           >
              //             <Container variant={"tooltip"} p={".1rem"} bg={"black"}>
              //               <Text color={"white"} fontSize={".75rem"}>
              //                 in {nextCheckinTime}
              //               </Text>
              //             </Container>
              //           </motion.div>
              //         )}
              //       </AnimatePresence>
              //       <AnimatePresence>
              //         {!hasCheckedIn && (
              //           <motion.div
              //             initial={{ scale: 0, rotateZ: "90deg" }}
              //             animate={{ scale: 1, rotateZ: "0deg" }}
              //             exit={{ scale: 0 }}
              //             style={{
              //               width: "1.5rem",
              //               height: "1.5rem",
              //               position: "absolute",
              //               top: "1rem",
              //             }}
              //           >
              //             <svg width="1.5rem" height="1.5rem" viewBox="0 0 25 24" fill="none">
              //               <path
              //                 d="M25 0C19.4712 6.89109 15.3045 14.8911 12.5 24C9.69551 14.8911 5.52885 6.89109 0 2.16047e-06L6.25 1.62035e-06C8.13301 2.45545 10.2163 5.9604 12.5 10.5149C14.7837 5.9604 16.867 2.45545 18.75 5.40116e-07L25 0Z"
              //                 fill="black"
              //               />
              //             </svg>
              //           </motion.div>
              //         )}
              //       </AnimatePresence>
              //       <Text mt={"2rem"} fontWeight={"bold"}>
              //         checkin
              //       </Text>
              //       <AnimatePresence>
              //         {checkinAmount && (
              //           <motion.div
              //             initial={{ scale: 0, rotateZ: "90deg" }}
              //             animate={{ scale: 1, rotateZ: "0deg" }}
              //             exit={{ scale: 0 }}
              //             style={{
              //               position: "absolute",
              //               top: "-1rem",
              //               left: "-.75rem",
              //             }}
              //           >
              //             <Container
              //               variant={"tooltip"}
              //               h={"1.75rem"}
              //               p={".1rem .5rem"}
              //               fontWeight={"bold"}
              //             >
              //               {checkinAmount}
              //             </Container>
              //           </motion.div>
              //         )}
              //       </AnimatePresence>
              //     </Button>
              //   </motion.div>
              //   <motion.div
              //     initial={{ y: 300, opacity: 0 }}
              //     animate={{ y: 0, opacity: 1 }}
              //     exit={{ y: -300, opacity: 0 }}
              //     transition={{ delay: 0.4 }}
              //     whileTap={{ scale: 0.9, transition: { delay: 0 } }}
              //     whileHover={{ scale: 1.1, transition: { delay: 0 } }}
              //   >
              //     <Container
              //       transition={".1s"}
              //       bg={`conic-gradient(from ${
              //         360 - ((MAX_SCORE_PER_MIN - localEnergy!) / MAX_SCORE_PER_MIN) * 360
              //       }deg at 50% 50%, #2F2F2F 0deg, #FFFFFF 360deg)`}
              //       borderRadius={"lg"}
              //       p={".5rem"}
              //     >
              //       <Button
              //         onClick={pump}
              //         w={"4rem"}
              //         h={"4rem"}
              //         isLoading={process.includes(EProcess.depleted)}
              //         _loading={{
              //           opacity: 1,
              //           bg: "white",
              //           _hover: {
              //             opacity: 1,
              //             bg: "white",
              //           },
              //         }}
              //         flexDir={"column"}
              //         bg={"white"}
              //         color={"black"}
              //         border="1px solid black"
              //         variant={"unstyled"}
              //         display={"flex"}
              //         p={".5rem"}
              //         alignItems={"center"}
              //         justifyContent={"center"}
              //       >
              //         <svg width="1.5rem" height="1.5rem" viewBox="0 0 35 34" fill="none">
              //           <path
              //             d="M4.9957 1.04455L4.20547 2.08097L3.74883 2.98548C3.49453 3.48351 3.19102 4.09459 3.06797 4.34764C2.83828 4.82681 2.81094 4.90758 2.17109 7.1877C2.08359 7.49997 2.06719 7.62381 1.95508 8.82982C1.85391 9.90393 1.83203 10.2404 1.83203 10.7277C1.83203 11.6726 1.93594 12.6175 2.14922 13.6162C2.20117 13.8558 2.24219 14.0604 2.24219 14.0658C2.24219 14.0738 2.29141 14.0712 2.35156 14.0631L2.46094 14.0442V27.8354H0V33.5963H5.63281V27.8354H3.17188V13.8935L3.27578 13.8666C3.33047 13.8531 3.74063 13.7643 4.18359 13.6727C4.62656 13.5785 4.9957 13.5005 4.99844 13.4978C5.00391 13.4951 4.97109 13.3228 4.92461 13.1182C4.76602 12.4183 4.65117 11.4761 4.64844 10.865C4.6457 10.5581 4.67852 10.0843 4.75508 9.2417C4.81797 8.58754 4.86719 8.03299 4.86719 8.01146C4.86719 7.98723 4.88359 7.96838 4.90547 7.96838C4.93828 7.96838 8.04453 8.84059 16.1 11.1073C16.1766 11.1315 16.2422 11.1611 16.2422 11.1773C16.2422 11.1907 15.7691 12.3214 15.1922 13.6835C13.0074 18.8414 9.09453 28.0803 7.8832 30.9312C7.36641 32.1533 6.93984 33.1628 6.93711 33.1736C6.93438 33.1844 7.36914 33.3755 7.90235 33.5963C8.70625 33.9274 8.87578 33.9893 8.89492 33.957C8.9168 33.9193 10.2402 30.7993 11.8344 27.0305C12.2063 26.1529 12.5234 25.4287 12.5398 25.4233C12.5563 25.4153 13.3 25.7195 14.1941 26.0963C15.9988 26.8555 21.4703 29.1571 23.6523 30.0751C24.4262 30.4008 25.0742 30.6808 25.0934 30.697C25.1125 30.7158 25.4352 31.4615 25.8152 32.3579C26.1926 33.2544 26.5043 33.9893 26.507 33.992C26.5098 33.9947 26.95 33.8197 27.4832 33.5989C28.1395 33.3271 28.4484 33.1871 28.443 33.1628C28.4348 33.1278 27.3055 30.4493 21.7246 17.2612C20.527 14.4265 19.5508 12.106 19.5563 12.0979C19.5699 12.0871 25.9438 13.8746 25.9656 13.8989C25.9738 13.9069 25.8918 14.23 25.7852 14.6176C25.6785 15.008 25.5992 15.3337 25.6129 15.3445C25.6238 15.3579 26.7613 15.8021 28.1367 16.3351C31.6148 17.6838 33.1106 18.2653 33.2281 18.3138C33.2856 18.338 33.3375 18.3487 33.343 18.338C33.3484 18.3272 33.3867 18.198 33.4277 18.0499C33.466 17.9019 33.5234 17.6892 33.5535 17.5788C33.5863 17.4685 33.7176 16.9758 33.8516 16.4886C33.9856 15.9986 34.1195 15.5033 34.1523 15.3849C34.1852 15.2664 34.3191 14.7684 34.4531 14.2811C34.7238 13.2824 34.7731 13.102 34.8797 12.7198C34.9891 12.3187 34.9891 12.3348 34.9152 12.3187C34.8797 12.3106 34.5598 12.2541 34.207 12.1948C33.8543 12.1329 33.3676 12.0495 33.127 12.0064C32.8863 11.9633 32.468 11.8906 32.1973 11.8449C31.6914 11.756 31.3086 11.6914 30.1875 11.4949C29.0609 11.2984 28.6809 11.2311 28.1777 11.1449C27.907 11.0992 27.4887 11.0238 27.2508 10.9807C27.0102 10.9404 26.8106 10.9081 26.8078 10.9107C26.8051 10.9134 26.7586 11.0857 26.7012 11.293C26.5535 11.8395 26.5453 11.8718 26.5207 11.8718C26.5098 11.8718 24.0488 11.1799 21.0492 10.3347C18.0523 9.49206 13.3164 8.15682 10.5273 7.37345C7.73828 6.58738 5.45234 5.9413 5.44688 5.93861C5.41953 5.909 5.62734 5.44867 6.05391 4.60876L6.55703 3.6208L7.29805 2.6436C7.70547 2.10789 8.03906 1.66371 8.03906 1.65563C8.03906 1.64756 5.8707 0.0565851 5.81055 0.021589C5.79688 0.0135133 5.42774 0.473844 4.9957 1.04455ZM19.0422 16.354C19.7695 18.0715 20.3574 19.4848 20.3465 19.4928C20.3219 19.5198 13.9727 22.0179 13.9727 22.0018C13.9727 21.9937 14.7137 20.2412 15.616 18.1065C16.5211 15.9744 17.3605 13.9931 17.4809 13.705C17.6039 13.417 17.7051 13.1936 17.7106 13.207C17.716 13.2205 18.3148 14.6365 19.0422 16.354ZM22.5695 24.6857C23.3242 26.4705 23.934 27.9323 23.9258 27.935C23.9176 27.9404 22.5586 27.3723 20.9043 26.6778C19.25 25.9806 17.1555 25.1003 16.2504 24.718C15.3426 24.3385 14.6043 24.0208 14.6043 24.0127C14.6043 23.9912 21.1203 21.4284 21.1586 21.4365C21.1805 21.4392 21.7848 22.8336 22.5695 24.6857Z"
              //             fill="black"
              //           />
              //         </svg>
              //         pump
              //       </Button>
              //     </Container>
              //   </motion.div>
              // </Flex>
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
          </AnimatePresence>
          <Flex w={"100%"} alignItems={"center"} justifyContent={"space-between"} px={".5rem"}>
            <AnimatePresence>
              {currentGangId && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Button
                    onClick={() => router.push("/gangs")}
                    variant={"unstyled"}
                    p={".5rem"}
                    bg={"white"}
                    height={"auto"}
                    borderRadius={"full"}
                    // pos={"fixed"}
                    // left={"2rem"}
                    // bottom={"1rem"}
                    flexDir={"row"}
                    display={"flex"}
                    gap={".5rem"}
                  >
                    <Image
                      src={GANGS.filter(({ id }) => id === currentGangId)[0].image}
                      w={"2.5rem"}
                    ></Image>
                    {/* <Text color={"black"} fontWeight={"bold"}>
                      {GANGS.filter(({ id }) => id === currentGangId)[0].name}
                    </Text> */}
                  </Button>{" "}
                  <AnimatePresence>
                    {clientPlayerScore && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        // style={{ height: "2rem" }}
                      >
                        <Flex flexDir={"column"} gap={".25rem"} alignItems={"center"}>
                          <Flex gap={".5rem"} w={"100%"} justifyContent={"center"}>
                            <AnimatedCounter
                              value={clientPlayerScore}
                              color="#28c300"
                              fontSize="1.5rem"
                            ></AnimatedCounter>
                            <Container
                              bg={"linear-gradient(180deg, #59FF30 0%, #44C324 100%)"}
                              borderRadius={"md"}
                              m={0}
                              textAlign={"center"}
                              w={"auto"}
                            >
                              <Text color={"black"} fontWeight={"medium"}>
                                {currentGangId}
                              </Text>
                            </Container>
                          </Flex>

                          {/* <Flex gap={".25rem"} alignItems={"center"}>
                            <Text fontWeight={"bold"}>
                              Allowance {Math.round(localEnergy!)} (
                              {ENERGY_RESTORE_PER_SECOND.toFixed(1)} p/s)
                            </Text>
                          </Flex> */}
                        </Flex>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Menu>
                    <MenuButton
                      // onClick={() => router.push("/gangs")}
                      p={".5rem"}
                      bg={"white"}
                      height={"3.5rem"}
                      justifyContent={"center"}
                      alignContent={"center"}
                      w={"3.5rem"}
                      borderRadius={"full"}
                      // pos={"fixed"}
                      // right={"2rem"}
                      // bottom={"1rem"}
                      flexDir={"row"}
                      display={"flex"}
                      gap={".5rem"}
                    >
                      <svg width="100%" height="19" viewBox="0 0 25 19" fill="none">
                        <rect width="25" height="3" rx="1.5" fill="#111111" />
                        <rect y="8" width="25" height="3" rx="1.5" fill="#111111" />
                        <rect y="16" width="25" height="3" rx="1.5" fill="#111111" />
                      </svg>

                      {/* <Text color={"black"} fontWeight={"bold"}>
                      {GANGS.filter(({ id }) => id === currentGangId)[0].name}
                    </Text> */}
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
                          onClick={beef}
                          bg={"black"}
                          p={"1rem"}
                          w={"5rem"}
                          h={"5rem"}
                          _hover={{ bg: "black" }}
                        >
                          <Flex flexDir={"column"} gap={".5rem"} align={"center"}>
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                              <g clip-path="url(#clip0_589_997)">
                                <path
                                  d="M15.8054 0.0524426C15.7429 0.0824413 15.6679 0.149942 15.6304 0.207441L15.5629 0.307442L15.5554 1.03994L15.5479 1.76994L15.3929 1.78494C15.3079 1.79244 15.0704 1.80994 14.8629 1.82494C11.5729 2.06244 8.40038 3.51494 6.00288 5.88244C3.49788 8.35744 2.03038 11.5749 1.79788 15.0924L1.76788 15.5499H1.10788C0.365376 15.5499 0.270376 15.5649 0.140376 15.6899C-0.0721236 15.8974 -0.0196236 16.2599 0.242876 16.3899C0.327876 16.4324 0.407876 16.4374 1.05288 16.4449L1.76788 16.4524L1.78538 16.7574C1.96788 19.9549 3.16038 22.9024 5.26038 25.3374C5.53288 25.6524 6.20788 26.3324 6.55038 26.6374C8.94038 28.7549 11.9029 29.9874 15.1129 30.1999C15.3204 30.2124 15.5029 30.2249 15.5204 30.2249C15.5429 30.2249 15.5504 30.3824 15.5504 30.9299C15.5504 31.5649 15.5554 31.6474 15.5979 31.7399C15.7479 32.0699 16.1979 32.0824 16.3804 31.7624C16.4379 31.6649 16.4379 31.6474 16.4379 30.9449V30.2274L16.6504 30.2124C17.7104 30.1399 18.1854 30.0774 18.9654 29.9099C22.4054 29.1774 25.4379 27.1974 27.5229 24.3274C28.9029 22.4299 29.8029 20.1574 30.1004 17.8249C30.1579 17.3724 30.2004 16.8624 30.2004 16.6224V16.4524L30.9454 16.4449C31.6704 16.4374 31.6904 16.4349 31.7804 16.3799C32.0679 16.1999 32.0554 15.7574 31.7579 15.6099C31.6729 15.5674 31.5904 15.5624 30.9329 15.5549L30.2004 15.5474V15.3774C30.2004 15.2849 30.1879 15.0624 30.1754 14.8849C29.9329 11.8199 28.7204 8.94994 26.6754 6.61244C24.2354 3.81994 20.6779 2.05244 17.0129 1.81244C16.8904 1.80494 16.7104 1.79244 16.6129 1.78494L16.4379 1.77244L16.4454 1.16744C16.4554 0.454943 16.4454 0.339943 16.3579 0.204943C16.2354 0.0149422 16.0029 -0.0500565 15.8054 0.0524426ZM15.5504 5.33494V7.11744L15.3329 7.13494C12.6104 7.34494 10.1679 8.75994 8.63788 11.0099C7.93288 12.0474 7.45788 13.2124 7.23788 14.4499C7.18538 14.7499 7.12538 15.2624 7.12538 15.4174V15.5499H5.33788C3.92538 15.5499 3.55038 15.5424 3.55038 15.5174C3.55038 15.4024 3.60788 14.7349 3.64038 14.4749C4.05038 11.1249 5.82038 8.07744 8.53538 6.03744C10.5279 4.54494 12.8829 3.69744 15.4004 3.56744C15.4754 3.56244 15.5404 3.55744 15.5454 3.55494C15.5479 3.55244 15.5504 4.35244 15.5504 5.33494ZM17.0629 3.60244C19.9979 3.83994 22.7929 5.16244 24.8904 7.30244C26.5854 9.03494 27.7279 11.1999 28.1979 13.5624C28.3204 14.1749 28.4254 15.0299 28.4254 15.4049V15.5499H26.6529H24.8804L24.8629 15.3799C24.7829 14.4899 24.6654 13.9149 24.4154 13.1624C23.3054 9.83744 20.2904 7.45744 16.7904 7.14744L16.4504 7.11744L16.4454 5.34244C16.4404 4.36744 16.4404 3.56994 16.4429 3.56744C16.4504 3.55994 16.7354 3.57494 17.0629 3.60244ZM15.5504 10.5124V12.1249L15.4954 12.1349C15.4629 12.1424 15.3379 12.1674 15.2129 12.1899C14.7829 12.2699 14.2654 12.4799 13.8779 12.7324C12.9829 13.3149 12.3804 14.2099 12.1729 15.2699L12.1179 15.5499H10.5054H8.89288L8.91288 15.3424C9.02788 13.9974 9.56788 12.6574 10.4304 11.5674C10.6754 11.2599 11.2329 10.6974 11.5254 10.4649C12.4854 9.70244 13.5554 9.21494 14.7254 9.00244C14.9754 8.95744 15.3104 8.91494 15.4954 8.90244L15.5504 8.89994V10.5124ZM17.0129 8.96494C19.6129 9.32244 21.8554 11.1774 22.7129 13.6774C22.8979 14.2149 23.0254 14.8074 23.0704 15.3174L23.0904 15.5499H21.4754H19.8579L19.8279 15.3474C19.6804 14.3749 19.0629 13.3999 18.2279 12.8124C17.8004 12.5149 17.2354 12.2724 16.7529 12.1849C16.6329 12.1624 16.5154 12.1424 16.4879 12.1374C16.4379 12.1274 16.4379 12.1099 16.4454 10.5124L16.4504 8.89744L16.5954 8.91244C16.6729 8.91994 16.8629 8.94494 17.0129 8.96494ZM7.12538 16.5824C7.12538 16.7374 7.18538 17.2499 7.23788 17.5499C7.83288 20.8924 10.3004 23.6274 13.5504 24.5449C14.1729 24.7199 14.7054 24.8174 15.3329 24.8649L15.5504 24.8824V26.6599V28.4399L15.3829 28.4324C13.0604 28.3224 10.7654 27.5374 8.85038 26.1899C6.12288 24.2749 4.25538 21.3174 3.71538 18.0624C3.64538 17.6449 3.55038 16.7349 3.55038 16.4799C3.55038 16.4574 3.92538 16.4499 5.33788 16.4499H7.12538V16.5824ZM12.1729 16.7299C12.4804 18.2899 13.7029 19.5224 15.2254 19.8124C15.3429 19.8349 15.4629 19.8574 15.4954 19.8649L15.5504 19.8749V21.4874C15.5504 22.3749 15.5429 23.0999 15.5329 23.0999C15.2654 23.0924 14.6329 22.9899 14.2254 22.8849C12.1479 22.3524 10.3929 20.8824 9.51288 18.9324C9.19788 18.2324 8.97538 17.3949 8.91288 16.6549L8.89288 16.4499H10.5054H12.1179L12.1729 16.7299ZM23.0704 16.6799C22.9929 17.5799 22.6904 18.5724 22.2454 19.3874C21.3754 20.9799 19.9429 22.1799 18.2329 22.7474C17.7079 22.9224 17.2079 23.0249 16.5954 23.0849L16.4504 23.0999L16.4454 21.4874C16.4379 19.8899 16.4379 19.8724 16.4879 19.8624C16.5154 19.8574 16.6379 19.8349 16.7604 19.8124C17.8029 19.6199 18.7754 18.9249 19.3454 17.9749C19.5754 17.5899 19.7629 17.0749 19.8279 16.6524L19.8579 16.4499H21.4754H23.0904L23.0704 16.6799ZM28.4254 16.5799C28.4254 16.6524 28.4129 16.8474 28.4004 17.0124C28.1429 20.0349 26.8554 22.7749 24.6979 24.8899C23.7029 25.8624 22.6604 26.5974 21.4129 27.2024C20.2454 27.7699 19.0079 28.1474 17.7479 28.3224C17.1579 28.4049 16.4504 28.4574 16.4504 28.4174C16.4504 28.4074 16.4504 27.6074 16.4504 26.6399V24.8824L16.7954 24.8524C17.2054 24.8149 17.7279 24.7274 18.1379 24.6274C21.0629 23.9074 23.4629 21.6949 24.4154 18.8374C24.6654 18.0849 24.7829 17.5099 24.8629 16.6174L24.8804 16.4499H26.6529H28.4254V16.5799Z"
                                  fill="white"
                                />
                              </g>
                              <defs>
                                <clipPath id="clip0_589_997">
                                  <rect width="32" height="32" fill="white" />
                                </clipPath>
                              </defs>
                            </svg>
                            <Text>BEEF</Text>
                          </Flex>
                        </Button>
                        <Button
                          bg={"black"}
                          p={"1rem"}
                          w={"5rem"}
                          h={"5rem"}
                          onClick={invite}
                          _hover={{ bg: "black" }}
                        >
                          <Flex flexDir={"column"} gap={".5rem"} align={"center"}>
                            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                              <path
                                d="M26 15.2832H15.4143V26H10.5393V15.2832H0V10.7168H10.5393V0H15.4143V10.7168H26V15.2832Z"
                                fill="white"
                              />
                            </svg>
                            <Text
                              lineHeight={"1rem"}
                              fontWeight={"bold"}
                              fontSize={process.includes(EProcess.inviting) ? ".75rem" : "1rem"}
                            >
                              {process.includes(EProcess.inviting) ? "link copied" : "INVITE"}
                            </Text>
                          </Flex>
                        </Button>
                      </Flex>
                    </MenuList>
                  </Menu>
                </motion.div>
              )}
            </AnimatePresence>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
}
