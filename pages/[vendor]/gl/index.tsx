"use client";

import { useEffect, useState } from "react";
import { Button, Flex, IconButton, ScaleFade, Text, useDisclosure } from "@chakra-ui/react";

import LotteryTicketIcon from "@/components/icons/Ticket";
import LotteryTicketsIcon from "@/components/icons/Tickets";
import { ChevronLeftIcon, CloseIcon, RepeatClockIcon } from "@chakra-ui/icons";
import LotteryTicketTemplate from "@/components/icons/TicketTemplate";
import useLottery from "@/features/useLottery";
import { isEmpty, size } from "lodash";
import { TLotteryTicket } from "lag-types";
import useRouter, { ERouterPaths } from "@/features/useRouter";
import useUser from "@/features/useUser";

export default function Page() {
  const { push: routePush } = useRouter();

  const {
    unusedTickets,
    usedTickets,
    winningTickets,
    loosingTickets,
    freeTicketCountdown,
    useTicket,
    isUsingTicket,
    redeemTicket,
    isRedeemingTicket,
    rules,
    lastUsedTicketInSession,
  } = useLottery();

  const { currentUser } = useUser();

  const [lastUsedTicket, setLastUsedTicket] = useState<TLotteryTicket>();

  const hasLastUsedTicketWon =
    lastUsedTicket &&
    rules &&
    (lastUsedTicket.result! >= +Object.keys(rules.scoreRewards)[0] ? true : false);

  useEffect(() => {
    lastUsedTicketInSession &&
      (setLastUsedTicket(lastUsedTicketInSession),
      !getHasTicketWon(lastUsedTicketInSession) &&
        setTimeout(() => setLastUsedTicket(undefined), 2000));
  }, [lastUsedTicketInSession]);

  const {
    isOpen: isOpenUsedTickets,
    onOpen: onOpenUsedTickets,
    onClose: onCloseUsedTickets,
  } = useDisclosure();

  const getHasTicketWon = (ticket: TLotteryTicket) =>
    rules && (ticket.result! >= +Object.keys(rules.scoreRewards)[0] ? true : false);

  const getLotteryTicketResult = (result: number) =>
    rules &&
    [
      { reward: 10_000, bgGradientStop1: "6C3401", bgGradientStop2: "F87701" },
      { reward: 50_000, bgGradientStop1: "6D6D6D", bgGradientStop2: "FBFBFB" },
      { reward: "2x", bgGradientStop1: "FFB01B", bgGradientStop2: "FFD665" },
    ][Object.keys(rules.scoreRewards).reduceRight((a, b, i) => (a >= +b ? i : a), result)];

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
            {unusedTickets !== undefined ? `${unusedTickets} TICKET(S)` : ""}
          </Text>

          <ScaleFade in={!!freeTicketCountdown}>
            <Flex gap={".5rem"} align={"center"}>
              <RepeatClockIcon opacity={0.5}></RepeatClockIcon>
              <Text fontSize={"1rem"} fontWeight={"bold"} opacity={0.5}>
                free ticket in {freeTicketCountdown}
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
          onClick={useTicket}
          isDisabled={!unusedTickets || hasLastUsedTicketWon === false}
          isLoading={isUsingTicket}
          variant={"accent"}
        >
          {hasLastUsedTicketWon === false ? "👀 Nada" : "Feelin' lucky!"}
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
          <IconButton
            onClick={() => routePush(ERouterPaths.GANG, currentUser?.currentGang)}
            aria-label="back"
            icon={<ChevronLeftIcon boxSize={10} />}
            variant={"unstyled"}
            color={"fg"}
          />
          <Button
            onClick={onOpenUsedTickets}
            variant={"unstyled"}
            h={"auto"}
            isDisabled={isEmpty(usedTickets)}
          >
            <Flex flexDir={"column"} justify={"center"} align={"center"} gap={".25rem"}>
              <LotteryTicketsIcon></LotteryTicketsIcon>
              <Text opacity={0.5} fontSize={".8rem"}>
                used tickets ({size(usedTickets) || 0})
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
          {winningTickets?.filter((ticket) => !ticket.redeemedAt).map((ticket, key) => (
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
                {getLotteryTicketResult(ticket.result)?.reward}
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
                  isLoading={isRedeemingTicket}
                >
                  Redeem
                </Button>
                {/* <Button isDisabled bg={"black"}>
                  Mint (soon)
                </Button> */}
              </Flex>
              <LotteryTicketTemplate {...getLotteryTicketResult(ticket.result)} />
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
        in={hasLastUsedTicketWon}
        style={{
          pointerEvents: hasLastUsedTicketWon ? "initial" : "none",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "#0000007d",
          backdropFilter: "blur(50px)",
        }}
      >
        {lastUsedTicket && (
          <Flex flexDir={"column"} justify={"center"} align={"center"} h={"100%"} gap={"1rem"}>
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
                {getLotteryTicketResult(lastUsedTicket.result)?.reward}
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
                  onClick={() =>
                    redeemTicket(lastUsedTicket.timestamp).then(() => setLastUsedTicket(undefined))
                  }
                  isLoading={isRedeemingTicket}
                >
                  Redeem
                </Button>
                <Button isDisabled bg={"black"}>
                  Mint (soon)
                </Button>
              </Flex>
              <LotteryTicketTemplate {...getLotteryTicketResult(lastUsedTicket.result)} />
            </Flex>
            <Button onClick={() => setLastUsedTicket(undefined)} w={"80%"}>
              Redeem later
            </Button>
          </Flex>
        )}
      </ScaleFade>
    </Flex>
  );
}
