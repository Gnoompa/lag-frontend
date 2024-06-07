"use client";

import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Image,
  Menu,
  MenuButton,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  ScaleFade,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { IGang } from "@/typings";
import useArweave from "@/features/useArweave";
import { usePrivy } from "@privy-io/react-auth";
import useWallet from "@/features/useWallet";
import { useAtom, useAtomValue } from "jotai";
import {
  persistedGlobalStateAtom,
  persistedPlayerScoreAtom,
  persistedPlayerStateAtom,
  persistedStateAtom,
} from "@/state";
import { GANG_LEVEL_STEP, GANGS } from "@/const";
import UserCount from "@/components/icons/UserCount";
import { CheckCircleIcon, ChevronLeftIcon, HamburgerIcon } from "@chakra-ui/icons";
import { without } from "lodash";
import TargetIcon from "@/components/icons/Target";
import InviteIcon from "@/components/icons/Invite";
import { useSpring } from "framer-motion";
import RewardIcon from "@/components/icons/Reward";
import { AnimatedCounter } from "@/components/Counter";
import { useReadContract } from "wagmi";
import { Address, formatEther, parseAbi } from "viem";
import WalletIcon from "@/components/icons/Wallet";

export enum EStage {
  initial,
}

export default function Page() {
  enum EProcess {
    inviting,
    settingCurrentGang,
    hasSetCurrentGang,
    checkingIn,
  }

  const [processes, setProcesses] = useState<EProcess[]>([]);
  const [stage, setStage] = useState<EStage>(EStage.initial);

  const [lastCheckin, setLastCheckin] = useState<number>();

  const [checkinAmount, setCheckinAmount] = useState<number>();
  const [hasCheckedIn, setHasCheckedIn] = useState<Boolean>();
  const [nextCheckinTime, setNextCheckinTime] = useState<string>();

  const router = useRouter();
  const { ready, user, login, authenticated, logout } = usePrivy();
  const { signFn } = useWallet();
  const { write, ready: arReady, auth, isLoading, arWallet } = useArweave(user?.wallet?.address);

  const [gang, setGang] = useState<IGang>();
  const [gangMetadata, setGangMetadata] = useState<{
    name: string;
    image: string;
    ticker: string;
  }>();
  const persistedState = useAtomValue(persistedStateAtom);
  const [persistedPlayerState, setPersistedPlayerState] = useAtom(persistedPlayerStateAtom);
  const persistedPlayerScore = useAtomValue(persistedPlayerScoreAtom);
  const persistedGlobalState = useAtomValue(persistedGlobalStateAtom);
  // @ts-ignore
  const currentGangId = persistedPlayerState?.currentGang;
  // @ts-ignore
  const checkins = persistedPlayerState?.checkin;
  const canGangIn = ready && user?.wallet?.address && authenticated && arReady;
  // @ts-ignore
  const refAmount = persistedPlayerState?.invitees?.length || 0;

  const gangId = router.query.id as string;

  const {
    data: gangTokenBalance,
    error,
    status,
  } = useReadContract({
    //@ts-ignore
    address: GANGS.filter(({ id }) => id == gangId)[0]?.address,
    abi: parseAbi(["function balanceOf(address owner) view returns (uint256)"]),
    functionName: "balanceOf",
    args: [user?.wallet?.address as Address],
    chainId: 5000,
  });

  // @ts-ignore
  const playerScore = persistedPlayerScore?.[gangId]?.value;
  // @ts-ignore
  const playerLotteryScore = persistedPlayerScore?.[`lottery_${gangId}`]?.value;
  // @ts-ignore
  const gangScore = persistedGlobalState?.score?.[gangId];

  const checkinTimerInterval = useRef<any>();

  const gangMemberCount = persistedGlobalState
    ? // @ts-ignore
      persistedGlobalState?.gangMemberCount?.[gangId] || 0
    : undefined;

  const gangScoreProgress = useSpring(0);

  const {
    isOpen: isJoinGangModalOpen,
    onOpen: onJoinGangModalOpen,
    onClose: onJoinGangModalClose,
  } = useDisclosure();

  useEffect(() => {
    gangScore && gangScoreProgress.set(((gangScore % GANG_LEVEL_STEP) / GANG_LEVEL_STEP) * 100);
  }, [gangScore]);

  useEffect(() => {
    // @ts-ignore
    persistedState?.gangs?.[router.query.id] &&
      // @ts-ignore
      setGang(
        // @ts-ignore
        persistedState.gangs[router.query.id]
      );
  }, [router, persistedState]);

  useEffect(() => {
    gang &&
      // @ts-ignore
      fetch(`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}ipfs/${gang.metadata}`)
        .then((res) => res.json())
        .then(setGangMetadata);
  }, [gang]);

  useEffect(() => {
    clearInterval(checkinTimerInterval.current);

    lastCheckin ? initCheckin() : setHasCheckedIn(false);
  }, [lastCheckin]);

  useEffect(() => {
    ready &&
      user?.wallet?.address &&
      authenticated &&
      signFn &&
      auth(user?.wallet?.address!, signFn);
  }, [ready, user, authenticated, signFn]);

  useEffect(() => {
    persistedPlayerState &&
      gangId &&
      // @ts-ignore
      (setCheckinAmount(persistedPlayerState.checkin[gangId]?.value || 0),
      // @ts-ignore
      setLastCheckin(persistedPlayerState.checkin[gangId]?.lastTimestamp));
  }, [persistedPlayerState, gangId]);

  const invite = () => {
    setProcesses([...processes, EProcess.inviting]);

    setTimeout(() => setProcesses(without(processes, EProcess.inviting)), 2000);

    navigator.clipboard.writeText(`${location.origin}/?i=${arWallet?.address}`);
  };

  const onRaidButtonClick = () =>
    currentGangId === gangId
      ? router.push({
          pathname: `/[vendor]/raids`,
          query: { vendor: router.query.vendor || "main" },
        })
      : onJoinGangModalOpen();

  const joinGang = () => {
    write({ function: "gang", gang: gangId })
      .then(
        () => (
          setPersistedPlayerState({ ...persistedPlayerState, currentGang: gangId }),
          setProcesses([...processes, EProcess.settingCurrentGang])
        )
      )
      .catch(() => alert("Oops, smth went wrong..."))
      .finally(
        () => (
          setProcesses([...processes, EProcess.hasSetCurrentGang]),
          setTimeout(
            () => (
              setProcesses(without(processes, EProcess.settingCurrentGang)),
              setProcesses(without(processes, EProcess.hasSetCurrentGang)),
              onJoinGangModalClose()
            ),
            1000
          )
        )
      );
  };

  const initCheckin = () => {
    setHasCheckedIn(lastCheckin ? Date.now() - lastCheckin < 12 * 60 * 60 * 1000 - 1 : false);

    checkinTimerInterval.current = setInterval(
      () => (
        setHasCheckedIn(lastCheckin ? Date.now() - lastCheckin < 12 * 60 * 60 * 1000 - 1 : false),
        setNextCheckinTime(
          lastCheckin
            ? ((date): string =>
                // @ts-ignore
                [~~(date / 60), ~~date].reduce(
                  (a, b, i) =>
                    // @ts-ignore
                    +a ? `${a}${["h", "m", "s"][i]}` : i == 1 && !a ? `${b}s` : i == 0 ? b : a,
                  ~~(date / (60 * 60 * 1000))
                ))(12 * 60 * 60 * 1000 - (+Date.now() - lastCheckin))
            : undefined
        )
      ),
      1000
    );
  };

  const checkin = () => {
    setProcesses([...processes, EProcess.checkingIn]);

    write({ function: "checkin", gangId: currentGangId })
      .then(() => (setLastCheckin(+Date.now()), setCheckinAmount(checkinAmount! + 1)))
      .catch(() => alert("Oops, smth went wrong..."))
      .finally(() => setProcesses(without(processes, EProcess.checkingIn)));
  };

  return gangMetadata ? (
    <Flex width={"100%"} flexDirection={"column"} alignItems={"center"} padding={"1rem"}>
      <Container
        h={"20vh"}
        w={"100vw"}
        top={0}
        left={0}
        pos={"absolute"}
        overflow={"hidden"}
        overflowY={"hidden"}
        maxW={"none"}
        borderRadius={"0 0 30px 30px"}
      >
        <Button
          onClick={() =>
            router.push({
              pathname: `/[vendor]/gangs`,
              query: { vendor: router.query.vendor || "main" },
            })
          }
          pos={"fixed"}
          variant={"unstyled"}
          top={"1rem"}
          left={"1rem"}
          aria-label="back to gang list"
          gap={".25rem"}
          zIndex={1}
          display={"flex"}
        >
          <ChevronLeftIcon color={"black"}></ChevronLeftIcon>
          <Text color={"black"}>All Gangs</Text>
        </Button>
        <Flex
          height={"20vh"}
          overflow={"hidden"}
          pos={"fixed"}
          top={0}
          left={0}
          width={"100vw"}
          borderRadius={"0 0 30px 30px"}
        >
          <Image
            // @ts-ignore
            src={`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}ipfs/${gangMetadata.image}`}
            w={"150vw"}
            pos={"absolute"}
            top={0}
            left={"50vw"}
            maxW={"none"}
            transform={"translate(-50%, -50%)"}
          ></Image>
        </Flex>
        <Container
          backdropFilter={"blur(50px)"}
          bg={"#ffffff52"}
          maxW={"none"}
          w={"100vw"}
          h={"20vh"}
          top={0}
          left={0}
          pos={"fixed"}
          overflow={"hidden"}
          borderRadius={"0 0 30px 30px"}
          border={"2px solid black"}
        ></Container>
      </Container>
      <Container mt={"20vh"} pos={"absolute"} top={0}>
        <Flex mt={"-2.5rem"} px={"1.5rem"}>
          <Flex flexDir={"column"} gap={".25rem"} alignItems={"center"}>
            <Image
              //@ts-ignore
              src={`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}ipfs/${gangMetadata.image}`}
              w={"5rem"}
              h={"5rem"}
              borderRadius={"full"}
              border={"4px solid black"}
              bg={"black"}
            ></Image>
          </Flex>
          <Flex flexDir={"column"} gap={".25rem"} pl={".5rem"}>
            <Text color={"black"} fontWeight={"bold"} fontSize={"2rem"} mt={"-.25rem"}>
              {gangMetadata?.name!}
            </Text>
            <ScaleFade in={gangMemberCount !== undefined}></ScaleFade>
            <Flex gap={".25rem"} align={"center"}>
              <UserCount />
              <Text fontWeight={"bold"}>{gangMemberCount}</Text>
            </Flex>
            {/* <Text color={"white"} fontStyle={"italic"} opacity={0.8}>
              short desc
            </Text> */}
          </Flex>
        </Flex>
      </Container>
      <Flex
        mt={"calc(20vh + 3rem)"}
        flexDir={"column"}
        gap={"1rem"}
        px={"1rem"}
        w={"min(100%, 30rem)"}
      >
        {/* <Flex
          bg={"whiteAlpha.200"}
          p=".5rem 1.5rem"
          gap={"1rem"}
          alignItems={"center"}
          borderRadius={"xl"}
        >
          <Flex flexDir={"column"}>
            <Text color={"white"} fontWeight={"bold"}>
              💰 Bounty
            </Text>
            <Text fontSize={"2rem"} fontWeight={"bold"} color={"white"}>
              5 000
            </Text>
            <Text color={"white"} opacity={0.5} fontSize={".75rem"} fontWeight={300}>
              May 13 - Jun 13
            </Text>
          </Flex>
          <WideArrow />
          <Flex flexDir={"column"} flex={1} gap={".25rem"}>
            <Flex flex={1} justifyContent={"space-between"}>
              <Text fontSize={".9rem"}>My {gang?.name}</Text>
              <Text fontWeight={"bold"}>0</Text>
            </Flex>
            <Divider color={"whiteAlpha.100"}></Divider>
            <Flex flex={1} justifyContent={"space-between"}>
              <Text fontSize={".9rem"}>Activity</Text>
              <Text fontWeight={"bold"}>0</Text>
            </Flex>
            <Divider color={"whiteAlpha.100"}></Divider>
            <Flex flex={1} justifyContent={"space-between"}>
              <Text fontSize={".9rem"}>My Share</Text>
              <Text fontWeight={"bold"}>0</Text>
            </Flex>
          </Flex>
        </Flex> */}
        {currentGangId === gangId ? (
          <Flex flexDir={"column"} gap={"1rem"}>
            <Flex gap={"1rem"}>
              <ScaleFade delay={0.1} in style={{ display: "flex", flex: 0.33 }}>
                <Button
                  onClick={checkin}
                  variant={"main"}
                  isDisabled={!!hasCheckedIn}
                  isLoading={checkinAmount === undefined || processes.includes(EProcess.checkingIn)}
                  flex={1}
                  flexDir={"column"}
                  gap={"1rem"}
                >
                  <ScaleFade
                    in={!!checkinAmount}
                    style={{ position: "absolute", top: "-.5rem", left: "-.5rem" }}
                  >
                    <Flex
                      borderRadius={"full"}
                      border={"1px solid black"}
                      bg={"white"}
                      minW={"1.5rem"}
                      h="1.5rem"
                      p={".5rem"}
                      align={"center"}
                      justify={"center"}
                    >
                      <Text color={"black"} fontSize={".75rem"}>
                        {checkinAmount}
                      </Text>
                    </Flex>
                  </ScaleFade>
                  <Flex flexDir={"column"} align={"center"} gap={".5rem"}>
                    <Text>CHECK IN</Text>
                    {checkinAmount !== undefined && checkinAmount == 0 && (
                      <ScaleFade in>
                        <Flex gap={".25rem"} align={"baseline"}>
                          <Text color="accent">3X</Text>
                          <Text color="accent" fontSize={".75rem"}>
                            BOOST
                          </Text>
                        </Flex>
                      </ScaleFade>
                    )}
                    {hasCheckedIn && !!nextCheckinTime && (
                      <ScaleFade in>
                        <Text fontSize={".9rem"} color={"whiteAlpha.500"}>
                          in {nextCheckinTime}
                        </Text>
                      </ScaleFade>
                    )}
                  </Flex>

                  {/* <Switch size={"lg"}></Switch> */}
                </Button>
              </ScaleFade>
              <ScaleFade delay={0.2} in style={{ display: "flex", flex: 0.67 }}>
                <Button
                  variant={"main"}
                  // isDisabled={currentGangId !== gangId}
                  onClick={onRaidButtonClick}
                  borderRadius={"xl"}
                  justifyContent={"flex-start"}
                  alignItems={"flex-start"}
                  flex={1}
                  overflow={"hidden"}
                  fontSize={"1.25rem"}
                >
                  RAID
                  <Box
                    opacity={0.2}
                    pos={"absolute"}
                    right={"-2.5rem"}
                    top={"20%"}
                    transform={"rotateZ(20deg)"}
                  >
                    <TargetIcon />
                  </Box>
                </Button>
              </ScaleFade>
            </Flex>
            <Flex gap={"1rem"}>
              <ScaleFade delay={0.3} in style={{ display: "flex", flex: 0.67 }}>
                <Button
                  onClick={() =>
                    router.push({
                      pathname: `/[vendor]/gl`,
                      query: { vendor: router.query.vendor || "main" },
                    })
                  }
                  flex={1}
                  overflow={"hidden"}
                  borderRadius={"xl"}
                  variant={"main"}
                  justifyContent={"flex-start"}
                  alignItems={"flex-start"}
                >
                  <Flex flexDir={"column"} align={"flex-start"}>
                    <Text fontSize={"1rem"}>FEELIN&apos;</Text>
                    <Text fontSize={"1.5rem"}>LUCKY</Text>
                  </Flex>

                  <Box opacity={0.2} pos={"absolute"} right={"-2.5rem"} bottom={"-20%"}>
                    <RewardIcon />
                  </Box>
                </Button>
              </ScaleFade>
              <ScaleFade delay={0.4} in style={{ display: "flex", flex: 0.33 }}>
                <Button
                  onClick={invite}
                  flex={1}
                  borderRadius={"xl"}
                  overflow={"hidden"}
                  variant={"main"}
                  p={0}
                  flexDir={"column"}
                  alignContent={"center"}
                  justifyContent={"center"}
                  gap={".5rem"}
                >
                  {!processes.includes(EProcess.inviting) && (
                    <ScaleFade in>
                      <InviteIcon />
                    </ScaleFade>
                  )}
                  <Text
                    zIndex={1}
                    lineHeight={"1rem"}
                    fontWeight={"bold"}
                    fontSize={processes.includes(EProcess.inviting) ? ".75rem" : "1rem"}
                  >
                    {processes.includes(EProcess.inviting) && (
                      <ScaleFade in>
                        <Flex flexDir={"column"} gap={".5rem"} alignItems={"center"}>
                          <CheckCircleIcon color={"#6EFEC2"} boxSize={7}></CheckCircleIcon>
                          <Text>link copied</Text>
                        </Flex>
                      </ScaleFade>
                    )}
                    {!processes.includes(EProcess.inviting) && (
                      <ScaleFade in>
                        <Text opacity={0.8} fontSize={".9rem"}>
                          {refAmount} REFS
                        </Text>
                      </ScaleFade>
                    )}
                  </Text>
                </Button>
              </ScaleFade>
            </Flex>
          </Flex>
        ) : (
          <Button onClick={joinGang} variant={"accent"} size={"lg"} px={"5rem"} zIndex={"99999"}>
            GANG IN
          </Button>
        )}
        {/* <Text fontWeight={"bold"} mt={"2rem"}>
          About
        </Text> */}
      </Flex>

      <Flex
        w={"100%"}
        alignItems={"center"}
        justifyContent={"space-between"}
        px={"2rem"}
        pos={"fixed"}
        bottom={"1rem"}
      >
        <ScaleFade in>
          <Button
            isDisabled={currentGangId == router.query.id}
            isLoading={!currentGangId}
            onClick={() =>
              router.push({
                pathname: `/[vendor]/gang/${currentGangId}`,
                query: { vendor: router.query.vendor || "main" },
              })
            }
            variant={"unstyled"}
            // p={".5rem"}
            w={"3rem"}
            h={"3rem"}
            bg={"transparent"}
            border={"2px solid #ffffff70"}
            borderRadius={"full"}
            flexDir={"row"}
            display={"flex"}
            gap={".5rem"}
          >
            <Image
              src={GANGS.filter(({ id }) => id === currentGangId)[0]?.image}
              w={"2rem"}
            ></Image>
          </Button>
        </ScaleFade>
        {/* <CircularProgress
          value={gangScoreProgress.get()}
          bg={"#ffffff0f"}
          backdropFilter={"blur(20px)"}
          borderRadius={"full"}
          color="#6EFEC2"
          thickness={"7px"}
          size={"5rem"}
          capIsRound
          trackColor="whiteAlpha.200"
          fontSize={"3rem"}
        >
          <CircularProgressLabel>
            <Flex flexDir={"column"}>
              <Text fontWeight={"bold"}>{gangScore}</Text>
              <Text>LVL {~~(gangScore / GANG_LEVEL_STEP) + 1}</Text>
            </Flex>
          </CircularProgressLabel>
        </CircularProgress> */}
        <ScaleFade in>
          <Flex flexDir={"column"} gap={".5rem"} justify={"center"} align={"center"}>
            {!!gangTokenBalance && (
              <Flex gap={".5rem"} align={"center"} justify={"center"}>
                <WalletIcon></WalletIcon>
                <Text fontWeight={"bold"} fontSize={"1.25rem"}>
                  {(+formatEther(gangTokenBalance)).toFixed(2)}
                </Text>
              </Flex>
            )}
            <ScaleFade in={(playerScore || playerLotteryScore) !== undefined}>
              <AnimatedCounter
                value={playerScore || 0 + playerLotteryScore || 0}
                color="fg"
                fontSize="2rem"
              />
            </ScaleFade>
          </Flex>
        </ScaleFade>

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
              <HamburgerIcon boxSize={6} color={"white"} />
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
                  // onClick={invite}
                  _hover={{ bg: "black" }}
                >
                  <Flex flexDir={"column"} gap={".5rem"} align={"center"}>
                    <Text
                      lineHeight={"1rem"}
                      fontWeight={"bold"}
                      // fontSize={processes.includes(EProcess.inviting) ? ".75rem" : "1rem"}
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
      <Modal
        onClose={onJoinGangModalClose}
        isOpen={isJoinGangModalOpen}
        isCentered
        size={"sm"}
        closeOnOverlayClick={!processes.includes(EProcess.settingCurrentGang)}
      >
        <ModalOverlay bg="none" backdropFilter="auto" backdropBlur="2px" />
        <ModalContent bg={"black"}>
          <ModalCloseButton />
          <ModalBody>
            <Text>To raid you&apos;ll have to join this gang first.</Text>
            <Text>Penalty for leaving your current gang is 15%</Text>
          </ModalBody>
          <ModalFooter justifyContent={"space-around"}>
            <Button
              bg={"white"}
              color={"black"}
              onClick={() => joinGang()}
              isLoading={processes.includes(EProcess.settingCurrentGang)}
              isDisabled={processes.includes(EProcess.hasSetCurrentGang)}
            >
              {processes.includes(EProcess.hasSetCurrentGang) ? "Done!" : "Join"}
            </Button>
            <Button
              onClick={onJoinGangModalClose}
              // isLoading={process.includes(EProcess.settingCurrentGang)}
              // isDisabled={process.includes(EProcess.hasSetCurrentGang)}
              isLoading={false}
              isDisabled={true}
            >
              Nah
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  ) : (
    <Spinner
      pos={"fixed"}
      w={"2rem"}
      h={"2rem"}
      top={"calc(50%  - 1rem)"}
      left={"calc(50%  - 1rem)"}
    ></Spinner>
  );
}
