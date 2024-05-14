"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  CircularProgressLabel,
  Container,
  Divider,
  Flex,
  IconButton,
  Image,
  Menu,
  MenuButton,
  MenuList,
  ScaleFade,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { IGang } from "@/typings";
import useArweave from "@/features/useArweave";
import { usePrivy } from "@privy-io/react-auth";
import useWallet from "@/features/useWallet";
import { useAtom } from "jotai";
import { persistedPlayerStateAtom } from "@/state";
import { ERC20_TOKENS, GANGS } from "@/const";
import UserCount from "@/components/icons/UserCount";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircleIcon, ChevronLeftIcon, HamburgerIcon } from "@chakra-ui/icons";
import WideArrow from "@/components/icons/WideArrow";
import { without } from "lodash";
import TargetIcon from "@/components/icons/Target";
import FarmIcon from "@/components/icons/Farm";

export enum EStage {
  initial,
}

export default function Page() {
  enum EProcess {
    inviting,
  }

  const [process, setProcess] = useState<EProcess[]>([]);
  const [stage, setStage] = useState<EStage>(EStage.initial);

  const router = useRouter();
  const { ready, user, login, authenticated } = usePrivy();
  const { signFn } = useWallet();
  const { write, ready: arReady, auth, isLoading, arWallet } = useArweave(user?.wallet?.address);

  const [gang, setGang] = useState<IGang>();
  const [persistedPlayerState, setPersistedPlayerState] = useAtom(persistedPlayerStateAtom);
  // @ts-ignore
  const currentGangId = persistedPlayerState?.currentGuild;
  const canGangIn = ready && user?.wallet?.address && authenticated && arReady;

  useEffect(() => {
    router.query.id &&
      setGang(
        ((token) => ({ ...token, name: token.label, score: token.value }))(
          ERC20_TOKENS.filter((token) => token.id == router.query.id)[0]
        )
      );
  }, [router]);

  useEffect(() => {
    ready &&
      user?.wallet?.address &&
      authenticated &&
      signFn &&
      auth(user?.wallet?.address!, signFn);
  }, [ready, user, authenticated, signFn]);

  const invite = () => {
    setProcess([...process, EProcess.inviting]);

    setTimeout(() => setProcess(without(process, EProcess.inviting)), 2000);

    navigator.clipboard.writeText(`${location.origin}/?i=${arWallet?.address}`);
  };

  return (
    <Flex width={"100%"} flexDirection={"column"} alignItems={"center"} padding={"1rem"}>
      <Container
        h={"20vh"}
        w={"100vw"}
        top={0}
        left={0}
        pos={"fixed"}
        overflow={"hidden"}
        overflowY={"hidden"}
        maxW={"none"}
        borderRadius={"0 0 30px 30px"}
      >
        <Button
          onClick={() => router.push("/gangs")}
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
        <Image
          src={gang?.image}
          w={"150vw"}
          pos={"absolute"}
          top={0}
          left={"50vw"}
          maxW={"none"}
          transform={"translate(-50%, -50%)"}
        ></Image>
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
        ></Container>
      </Container>
      <Container mt={"20vh"} pos={"absolute"} top={0}>
        <Flex mt={"-2.5rem"} px={"1.5rem"}>
          <Flex flexDir={"column"} gap={".25rem"} alignItems={"center"}>
            <Image
              src={gang?.image}
              w={"5rem"}
              borderRadius={"full"}
              border={"4px solid black"}
              bg={"black"}
            ></Image>
          </Flex>
          <Flex flexDir={"column"} gap={".25rem"} pl={".5rem"}>
            <Text color={"black"} fontWeight={"bold"} fontSize={"2rem"} mt={"-.25rem"}>
              {gang?.name}
            </Text>
            <Flex gap={".25rem"} align={"center"}>
              <UserCount />
              <Text fontWeight={"bold"}>0</Text>
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
        w={"min(100%, 35rem)"}
      >
        <Flex
          bg={"whiteAlpha.200"}
          borderRadius={"lg"}
          p=".5rem 1.5rem"
          gap={"1rem"}
          alignItems={"center"}
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
        </Flex>
        <Flex flexDir={"column"} gap={"1rem"}>
          <Flex gap={"1rem"}>
            <ScaleFade delay={0.1} in style={{ display: "flex", flex: 0.33 }}>
              <Button py={"3rem"} flex={1}>
                CHECK IN
              </Button>
            </ScaleFade>
            <ScaleFade delay={0.2} in style={{ display: "flex", flex: 0.67 }}>
              <Button
                onClick={() => router.push(`/gbeef?id=${router.query.id}`)}
                py={"3rem"}
                flex={1}
                overflow={"hidden"}
              >
                RAID
                <Box
                  opacity={0.2}
                  pos={"absolute"}
                  right={"-2.5rem"}
                  bottom={"-2rem"}
                  transform={"rotateZ(20deg)"}
                >
                  <TargetIcon />
                </Box>
              </Button>
            </ScaleFade>
          </Flex>
          <Flex gap={"1rem"}>
            <ScaleFade delay={0.3} in style={{ display: "flex", flex: 0.67 }}>
              <Button py={"3rem"} flex={1} isDisabled overflow={"hidden"}>
                FARM (soon)
                <Box
                  opacity={0.5}
                  pos={"absolute"}
                  left={"-2rem"}
                  bottom={"-1rem"}
                  transform={"rotateZ(20deg)"}
                >
                  <FarmIcon />
                </Box>
              </Button>
            </ScaleFade>
            <ScaleFade delay={0.4} in style={{ display: "flex", flex: 0.33 }}>
              <Button onClick={invite} py={"3rem"} flex={1}>
                <Text
                  lineHeight={"1rem"}
                  fontWeight={"bold"}
                  fontSize={process.includes(EProcess.inviting) ? ".75rem" : "1rem"}
                >
                  {process.includes(EProcess.inviting) ? (
                    <Flex flexDir={"column"} gap={"1rem"} alignItems={"center"}>
                      <CheckCircleIcon color={"#6EFEC2"} boxSize={7}></CheckCircleIcon>
                      <Text>link copied</Text>
                    </Flex>
                  ) : (
                    "INVITE"
                  )}
                </Text>
              </Button>
            </ScaleFade>
          </Flex>
        </Flex>
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
            onClick={() => router.push(`/gang/${currentGangId}`)}
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
        <CircularProgress
          value={currentGangId ? 40 : 0}
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
              <Text fontWeight={"bold"}>1 000</Text>
              <Text>LVL 3</Text>
            </Flex>
          </CircularProgressLabel>
        </CircularProgress>

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
                      // fontSize={process.includes(EProcess.inviting) ? ".75rem" : "1rem"}
                    >
                      Account
                    </Text>
                  </Flex>
                </Button>
              </Flex>
            </MenuList>
          </Menu>
        </ScaleFade>
      </Flex>
    </Flex>
  );
}
