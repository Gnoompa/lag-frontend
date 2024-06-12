"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Flex, IconButton, ScaleFade, Text, useDisclosure } from "@chakra-ui/react";
import { useRouter } from "next/router";
import useArweave from "@/features/useArweave";
import { usePrivy } from "@privy-io/react-auth";
import useWallet from "@/features/useAccount";
import { useAtom } from "jotai";
import { arContractStateAtom, persistedPlayerStateAtom } from "@/state";
import { TNode } from "@/features/useBubbleMap";
import { last, without } from "lodash";
import LotteryTicketIcon from "@/components/icons/Ticket";
import LotteryTicketsIcon from "@/components/icons/Tickets";
import { ChevronLeftIcon, CloseIcon, RepeatClockIcon } from "@chakra-ui/icons";
import LotteryTicketTemplate from "@/components/icons/TicketTemplate";

const LotteryRewardsLevels = [5000, 8000, 9900];

export default function Page() {
  const [gangsMap, setGangsMap] = useState<TNode[]>();

  const [processes, setProcesses] = useState<EProcess[]>([]);
  const [stage, setStage] = useState<EStage>(EStage.initial);

  const {
    isOpen: isOpenUsedTickets,
    onOpen: onOpenUsedTickets,
    onClose: onCloseUsedTickets,
  } = useDisclosure();

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
  const [lotteryTicketsAmount, setLotteryTicketsAmount] = useState<number>();
  const [usedLotteryTickets, setUsedLotteryTickets] =
    useState<{ result: number; redeemed: boolean; timestamp: number }[]>();
  const winningTickets = usedLotteryTickets?.filter(
    ({ result }) => result >= LotteryRewardsLevels[0]
  );
  const loosingTickets = usedLotteryTickets?.filter(
    ({ result }) => result < LotteryRewardsLevels[0]
  );
  const [winningTicket, setWinningTicket] = useState<{
    result: number;
    redeemed: boolean;
    timestamp: number;
  }>();
  const redeemedTickets = usedLotteryTickets?.filter(({ redeemed }) => redeemed);
  const [lastDraw, setLastDraw] = useState<number>();
  const [hasDrawn, setHasDrawn] = useState<Boolean>();
  const [nextDrawTime, setNextDrawTime] = useState<string>();
  const drawTimerInterval = useRef<any>();

  // @ts-ignore
  const currentGangId = persistedPlayerState?.currentGang;

  useEffect(() => {
    ready &&
      user?.wallet?.address &&
      authenticated &&
      signFn &&
      auth(user?.wallet?.address!, signFn);
  }, [ready, user, authenticated, signFn]);

  useEffect(() => {
    arWallet &&
      arReady &&
      read({ function: "lotteryTickets", userId: arWallet?.address, timestamp: +Date.now() }).then(
        ({ result }) => setLotteryTicketsAmount(result as number)
      );
  }, [arReady, arWallet]);

  useEffect(() => {
    clearInterval(drawTimerInterval.current);

    lastDraw ? initDrawCountdown() : setHasDrawn(false);
  }, [lastDraw]);

  useEffect(() => {
    currentGangId &&
      persistedPlayerState &&
      // @ts-ignore
      (setLastDraw(persistedPlayerState.lotteryTickets?.lastTimestamp),
      setUsedLotteryTickets(
        // @ts-ignore
        Object.values(persistedPlayerState.lotteryTickets?.used?.[currentGangId] || {})
      ));
  }, [persistedPlayerState, currentGangId]);

  useEffect(() => {
    processes.includes(EProcess.hasDrawnBlankTicket) &&
      setTimeout(() => setProcesses(without(processes, EProcess.hasDrawnBlankTicket)), 1500);
  }, [processes]);

  const fetchLastLotteryResult = () => {
    read({ function: "user", id: arWallet?.address }).then(
      ({ result }) =>
        // @ts-ignore
        console.log(last(Object.values(result.lotteryTickets?.used[currentGangId]))) ||
        // @ts-ignore
        (isWinningTicket(last(Object.values(result.lotteryTickets?.used[currentGangId])).result)
          ? // @ts-ignore
            setWinningTicket(last(Object.values(result.lotteryTickets?.used[currentGangId])))
          : setProcesses((old) => [
              ...without(old, EProcess.drawing),
              EProcess.hasDrawnBlankTicket,
            ]),
        setProcesses((old) => without(old, EProcess.drawing)))
    );
  };

  const isWinningTicket = (result: number) => result >= LotteryRewardsLevels[0];

  const initDrawCountdown = () => {
    setHasDrawn(lastDraw ? Date.now() - lastDraw < 12 * 60 * 60 * 1000 - 1 : false);

    drawTimerInterval.current = setInterval(
      () => (
        setHasDrawn(lastDraw ? Date.now() - lastDraw < 12 * 60 * 60 * 1000 - 1 : false),
        setNextDrawTime(
          lastDraw
            ? ((date): string =>
                // @ts-ignore
                [~~(date / 60), ~~date].reduce(
                  (a, b, i) =>
                    // @ts-ignore
                    +a ? `${a}${["h", "m", "s"][i]}` : i == 1 && !a ? `${b}s` : i == 0 ? b : a,
                  ~~(date / (60 * 60 * 1000))
                ))(12 * 60 * 60 * 1000 - (+Date.now() - lastDraw))
            : undefined
        )
      ),
      1000
    );
  };

  const onDrawLotteryButtonClick = () => {
    setProcesses([...processes, EProcess.drawing]);

    write({ function: "drawLottery" }, { vrf: true })
      .then(
        () => (
          setLotteryTicketsAmount(lotteryTicketsAmount! - 1),
          fetchLastLotteryResult(),
          setHasDrawn(true),
          setProcesses((old) => [...old, EProcess.drawingResult])
        )
      )
      .catch(() => alert("Oops, smth went wrong..."));
    // .finally(() => setProcesses(without(processes, EProcess.drawing)));
  };

  const redeemTicket = (ticketId: number) => {
    setProcesses([...processes, EProcess.redeemingTicket]);

    write({ function: "redeemLotteryTicket", ticketId })
      .catch(() => alert("Oops, smth went wrong..."))
      .finally(
        () => (
          setProcesses((old) => without(old, EProcess.redeemingTicket)), setWinningTicket(undefined)
        )
      );
  };

  const getLotteryTicketReward = (result: number) =>
    ["10K", "50K", "2x"][LotteryRewardsLevels.reduceRight((a, b, i) => (a >= b ? i : a), result)];

  const getLotteryTicketResultGradients = (result: number) =>
    [
      { bgGradientStop1: "6C3401", bgGradientStop2: "F87701" },
      { bgGradientStop1: "6D6D6D", bgGradientStop2: "FBFBFB" },
      { bgGradientStop1: "FFB01B", bgGradientStop2: "FFD665" },
    ][LotteryRewardsLevels.reduceRight((a, b, i) => (a >= b ? i : a), result)];

  return (
    <Flex
      width={"100%"}
      flexDirection={"column"}
      alignItems={"center"}
      padding={"1rem"}
      py={"4rem"}
    >
      <Flex flexDir={"column"} justifyContent={"center"} align={"center"} gap={"2rem"}>
        <Flex flexDir={"column"} justify={"center"} align={"center"} gap={".25rem"}>
          <Text fontSize={"1.25rem"} fontWeight={"bold"}>
            {lotteryTicketsAmount} TICKET(S)
          </Text>

          <ScaleFade in={!!nextDrawTime && !!hasDrawn}>
            <Flex gap={".5rem"} align={"center"}>
              <RepeatClockIcon opacity={0.5}></RepeatClockIcon>
              <Text fontSize={"1rem"} fontWeight={"bold"} opacity={0.5}>
                free ticket in {nextDrawTime}
              </Text>
            </Flex>
          </ScaleFade>
        </Flex>
        <ScaleFade
          in
          style={{
            filter: "drop-shadow(0px 4px 129px rgba(255, 224, 119, 0.5))",
            maxWidth: "80vw",
          }}
        >
          <LotteryTicketIcon></LotteryTicketIcon>
        </ScaleFade>
        <Button
          onClick={onDrawLotteryButtonClick}
          isDisabled={!lotteryTicketsAmount}
          isLoading={processes.includes(EProcess.drawing)}
          variant={"accent"}
        >
          {processes.includes(EProcess.hasDrawnBlankTicket) ? "👀 Nada" : "Feelin' lucky!"}
        </Button>

        <Flex flexDir={"column"} gap={".5rem"} justify={"center"} align={"center"}>
          <Text opacity={0.5} fontSize={".9rem"} fontWeight={"bold"}>
            PRIZE POOL
          </Text>
          <Flex gap={"1rem"} border={"1px solid #ffffff3d"} borderRadius={"xl"} p={".5rem"}>
            <Flex
              flexDir={"column"}
              w={"5rem"}
              h={"5rem"}
              borderRadius={"lg"}
              bg={"linear-gradient(180deg, #FF7A00 0%, #A14D00 100.01%)"}
              p=".5rem"
              align={"center"}
              justify={"center"}
            >
              <Text fontSize={"1.25rem"} fontWeight={"bold"}>
                10K
              </Text>
              <Text opacity={0.8} fontSize={".8rem"}>
                rep. points
              </Text>
            </Flex>
            <Flex
              flexDir={"column"}
              w={"5rem"}
              h={"5rem"}
              borderRadius={"lg"}
              bg={"linear-gradient(180deg, #FEFEFE 0%, #A5A5A5 100%)"}
              p=".5rem"
              align={"center"}
              justify={"center"}
            >
              <Text fontSize={"1.25rem"} fontWeight={"bold"} color={"bg"}>
                50K
              </Text>
              <Text opacity={0.8} fontSize={".8rem"} color={"bg"}>
                rep. points
              </Text>
            </Flex>
            <Flex
              flexDir={"column"}
              w={"5rem"}
              h={"5rem"}
              borderRadius={"lg"}
              bg={"linear-gradient(180deg, #FED471 0%, #CD9000 100%)"}
              p=".5rem"
              align={"center"}
            >
              <Text fontSize={"1.5rem"} fontWeight={"bold"} color={"bg"}>
                2x
              </Text>
              <Text
                opacity={0.8}
                fontSize={".8rem"}
                textAlign={"center"}
                color={"bg"}
                lineHeight={"1rem"}
              >
                multiplier
              </Text>
            </Flex>
          </Flex>
        </Flex>

        <Flex
          w={"100%"}
          px={"2rem"}
          pos={"fixed"}
          left={"0"}
          bottom={"1rem"}
          justify={"space-between"}
        >
          <ScaleFade in={!!currentGangId} style={{ width: "2rem" }}>
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
          <Button
            onClick={onOpenUsedTickets}
            variant={"unstyled"}
            h={"auto"}
            isDisabled={!usedLotteryTickets?.length}
          >
            <Flex flexDir={"column"} justify={"center"} align={"center"} gap={".25rem"}>
              <LotteryTicketsIcon></LotteryTicketsIcon>
              <Text opacity={0.5} fontSize={".8rem"}>
                used tickets ({usedLotteryTickets?.length || 0})
              </Text>
            </Flex>
          </Button>
          <Flex style={{ width: "2rem" }}></Flex>
        </Flex>
      </Flex>
      <ScaleFade
        in={isOpenUsedTickets}
        style={{
          pointerEvents: isOpenUsedTickets ? "initial" : "none",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "#0000007d",
          backdropFilter: "blur(50px)",
        }}
      >
        <Flex
          flexDir={"column"}
          gap={"2rem"}
          overflowY={"scroll"}
          maxH={"calc(100% - 7rem)"}
          align={"center"}
          my={"2rem"}
          mb={"4rem"}
        >
          {!!loosingTickets?.length && <Text>BLANKS ({loosingTickets.length})</Text>}
          {winningTickets?.map((ticket, key) => (
            <Flex w={"80%"} pos={"relative"} justify={"center"} key={key}>
              <Text
                pos={"absolute"}
                left={"50%"}
                transform={"translateX(-50%)"}
                top={"20%"}
                fontWeight={"bold"}
                fontSize={"2rem"}
                color={"black"}
              >
                {getLotteryTicketReward(ticket.result)}
              </Text>
              <Flex
                pos={"absolute"}
                left={"50%"}
                gap={"1rem"}
                transform={"translateX(-50%)"}
                bottom={"20%"}
              >
                <Button
                  bg={"black"}
                  onClick={() => redeemTicket(ticket.timestamp)}
                  isLoading={processes.includes(EProcess.redeemingTicket)}
                >
                  Redeem
                </Button>
                <Button isDisabled bg={"black"}>
                  Mint (soon)
                </Button>
              </Flex>
              <LotteryTicketTemplate {...getLotteryTicketResultGradients(ticket.result)} />
            </Flex>
          ))}
          <IconButton
            onClick={onCloseUsedTickets}
            w={"80%"}
            aria-label="close"
            icon={<CloseIcon></CloseIcon>}
            pos={"absolute"}
            bottom={"1rem"}
          ></IconButton>
        </Flex>
      </ScaleFade>
      <ScaleFade
        in={!!winningTicket}
        style={{
          pointerEvents: !!winningTicket ? "initial" : "none",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "#0000007d",
          backdropFilter: "blur(50px)",
        }}
      >
        {winningTicket &&
          [winningTicket!].map((ticket, key) => (
            <Flex flexDir={"column"} justify={"center"} align={"center"} h={"100%"} gap={"1rem"} key={key}>
              <Flex w={"80%"} pos={"relative"} justify={"center"}>
                <Text
                  pos={"absolute"}
                  left={"50%"}
                  transform={"translateX(-50%)"}
                  top={"20%"}
                  fontWeight={"bold"}
                  fontSize={"2rem"}
                  color={"black"}
                >
                  {getLotteryTicketReward(ticket.result)}
                </Text>
                <Flex
                  pos={"absolute"}
                  left={"50%"}
                  gap={"1rem"}
                  transform={"translateX(-50%)"}
                  bottom={"20%"}
                >
                  <Button
                    bg={"black"}
                    onClick={() => redeemTicket(winningTicket.timestamp)}
                    isLoading={processes.includes(EProcess.redeemingTicket)}
                  >
                    Redeem
                  </Button>
                  <Button isDisabled bg={"black"}>
                    Mint (soon)
                  </Button>
                </Flex>
                <LotteryTicketTemplate {...getLotteryTicketResultGradients(ticket.result)} />
              </Flex>
              <Button onClick={() => setWinningTicket(undefined)} w={"80%"}>
                Redeem later
              </Button>
            </Flex>
          ))}
      </ScaleFade>
    </Flex>
  );
}

enum EStage {
  initial,
}

enum EProcess {
  drawing,
  drawingResult,
  hasDrawnBlankTicket,
  redeemingTicket,
}
