"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Image,
  PinInput,
  PinInputField,
  ScaleFade,
  SlideFade,
  Text,
} from "@chakra-ui/react";
import { ERC20_TOKENS, GANGS, VENDOR_CONFIG } from "@/const";
import { useRouter } from "next/router";
import useArweave from "@/features/useArweave";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useAtomValue } from "jotai";
import { persistedPlayerStateAtom, persistedStateAtom } from "@/state";
import useWallet from "@/features/useWallet";

export enum EStage {
  initial,
  login,
  gangSelection,
  game,
  confirmed,
}

export default function Page() {
  const router = useRouter();

  const { ready: privyReady, user, authenticated, isModalOpen, connectWallet, logout } = usePrivy();
  const { login } = useLogin({
    onComplete(user, isNewUser: boolean, wasAlreadyAuthenticated: boolean) {
      !wasAlreadyAuthenticated && setStage(EStage.confirmed);
    },
  });
  const { signFn } = useWallet();
  const { ready: arReady, getArWallet, auth } = useArweave(user?.wallet?.address);

  const persistedState = useAtomValue(persistedStateAtom);
  const persistedPlayerState = useAtomValue(persistedPlayerStateAtom);

  const [stage, setStage] = useState<EStage>();
  const [loggedIn, setLoggedIn] = useState<boolean>();
  const [passphase, setPassphase] = useState<string>();

  const shortAddress = `${user?.wallet?.address?.substring(
    0,
    6
  )}..${user?.wallet?.address?.substring(6, 10)}`;

  const isReady = !!persistedState;

  const bubbleMapItems = useMemo(
    () => [
      ...ERC20_TOKENS,
      {
        label: "",
        id: 1,
        image: "/banner1.svg",
        value: 200,
      },
      {
        label: "",
        id: 2,
        image: "/banner2.svg",
        value: 125,
      },
      {
        label: "",
        id: 3,
        image: "/banner3.svg",
        value: 150,
      },
      {
        label: "",
        id: 4,
        image: "/banner4.svg",
        value: 175,
      },
    ],
    []
  );

  // const { render: renderBubblemap, unmount: removeBubblemap } = useBubbleMap(bubbleMapItems, {
  //   height: global.innerHeight * 0.7,
  // });

  const checkLogin = (value: string) => {
    setPassphase(value?.toLocaleLowerCase());

    value?.toLowerCase() === "lagin" &&
      (localStorage.setItem("loginpasscode", "lagin"), setStage(EStage.initial), setLoggedIn(true));
  };

  useEffect(() => {
    setTimeout(() => setStage(EStage.initial), 100);

    // @ts-ignore
    global?.Telegram?.WebApp?.ready();

    setLoggedIn(localStorage.getItem("loginpasscode") === "lagin");

    // return removeBubblemap;
  }, []);

  useEffect(() => {
    stage === EStage.gangSelection &&
      arReady &&
      setTimeout(
        () =>
          router.push({
            pathname: "/[vendor]/gangs",
            query: { vendor: router.query.vendor || "main" },
          }),
        500
      );

    persistedState &&
      stage === EStage.game &&
      setTimeout(
        () =>
          router.push({
            pathname: `/[vendor]/gang/${
              // @ts-ignore
              persistedState.users[getArWallet(user.wallet?.address!)?.address].currentGang
            }`,
            query: { vendor: router.query.vendor || "main" },
          }),
        500
      );
  }, [user, stage, persistedState, router, arReady]);

  useEffect(() => {
    privyReady &&
      authenticated &&
      user &&
      signFn &&
      stage === EStage.confirmed &&
      auth(user.wallet?.address!, signFn, router.query.i as string | undefined);
  }, [stage, privyReady, authenticated, user, signFn, router]);

  useEffect(() => {
    privyReady &&
      isReady &&
      user &&
      authenticated &&
      persistedState &&
      stage === EStage.confirmed &&
      (signFn
        ? setStage(
            // @ts-ignore
            persistedState.gangs[
              // @ts-ignore
              persistedState.users[getArWallet(user.wallet?.address!)?.address]?.currentGang
            ]
              ? EStage.game
              : EStage.gangSelection
          )
        : connectWallet());
  }, [privyReady, user, arReady, stage, isReady, persistedState, arReady, signFn]);

  return (
    <Flex
      width={"100%"}
      flexDirection={"column"}
      alignItems={"center"}
      padding={"1rem"}
      p={"30vh 0rem 10vh"}
      height={"100vh"}
      justifyContent={"space-between"}
      suppressHydrationWarning
    >
      <Box className="glitch gl-4">
        <Text
          data-text="LAG"
          fontSize={"5rem"}
          fontWeight={"bold"}
          color={"fg"}
          suppressHydrationWarning
        >
          {VENDOR_CONFIG?.labels?.vendor || "LAG"}
        </Text>
      </Box>

      {VENDOR_CONFIG?.assets?.starter && (
        <ScaleFade in suppressHydrationWarning>
          <Image
            src={VENDOR_CONFIG?.assets?.starter}
            maxW={"80vw"}
            pb={"5rem"}
            suppressHydrationWarning
          ></Image>
        </ScaleFade>
      )}

      <SlideFade
        in={loggedIn === false}
        style={{
          position: "fixed",
          display: "flex",
          alignItems: "center",
          bottom: "20vh",
        }}
      >
        <Flex gap={".5rem"} flexDir={"column"} align={"center"}>
          <Flex gap={"1rem"}>
            <PinInput
              type="alphanumeric"
              size={"lg"}
              autoFocus
              colorScheme="whiteAlpha"
              isInvalid={passphase ? passphase !== "lagin" : false}
              onComplete={checkLogin}
            >
              <PinInputField />
              <PinInputField />
              <PinInputField />
              <PinInputField />
              <PinInputField />
            </PinInput>
          </Flex>
          <Text opacity={0.3} fontWeight={"100"}>
            code phrase
          </Text>
        </Flex>
      </SlideFade>
      <Flex flexDir={"column"} gap={"2rem"} align={"center"} justify={"center"}>
        <ScaleFade
          delay={0.3}
          in={stage !== EStage.login && loggedIn}
          style={{
            display: "flex",
            alignItems: "center",
            bottom: "15vh",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <Flex pos={"relative"}>
            <Button
              onClick={privyReady && authenticated ? () => setStage(EStage.confirmed) : login}
              // onClick={connectWallet}
              isLoading={
                !privyReady || !isReady || isModalOpen || (stage === EStage.confirmed && !arReady)
              }
              variant={"accent"}
              size={"lg"}
              px={"5rem"}
              zIndex={"99999"}
            >
              LAG IN
            </Button>
            <Text
              fontSize={"3rem"}
              pos={"absolute"}
              top={"-2.5rem"}
              whiteSpace={"nowrap"}
              left={"50%"}
              transform={"translateX(-50%)"}
            >
              💥🎰🤑
            </Text>
          </Flex>

          {privyReady && user?.wallet && !signFn && (
            <Button onClick={logout}>logout from {shortAddress}</Button>
          )}
        </ScaleFade>

        <Flex style={{ gap: ".5rem" }} alignItems={"flex-end"} height={"2rem"} opacity={0.5}>
          <Text mb={"1rem"} fontSize={".75rem"}>
            BY
          </Text>
          <Text mb={"1rem"} fontSize={"1rem"}>
            XLAG.TECH
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
}
