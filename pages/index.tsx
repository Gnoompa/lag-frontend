"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Flex } from "@chakra-ui/react";
import { ERC20_TOKENS } from "@/const";
import useBubbleMap from "@/features/useBubbleMap";
import { useRouter } from "next/router";
import useArweave from "@/features/useArweave";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useAtomValue } from "jotai";
import { persistedPlayerStateAtom, persistedStateAtom } from "@/state";
import useWallet from "@/features/useWallet";

export enum EStage {
  initial,
  gangSelection,
  game,
  confirmed,
}

export default function Page() {
  const router = useRouter();

  const { ready: privyReady, user, authenticated, isModalOpen } = usePrivy();
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

  const { render: renderBubblemap, unmount: removeBubblemap } = useBubbleMap(bubbleMapItems, {
    height: global.innerHeight * 0.7,
  });

  useEffect(() => {
    setTimeout(() => setStage(EStage.initial), 100);

    // @ts-ignore
    global?.Telegram?.WebApp?.ready();

    return removeBubblemap;
  }, []);

  useEffect(() => {
    stage === EStage.gangSelection && setTimeout(() => router.push("gangs"), 500);

    persistedState &&
      stage === EStage.game &&
      setTimeout(
        () =>
          router.push(
            `/gang/${
              // @ts-ignore
              persistedState.users[getArWallet(user.wallet?.address!)?.address].currentGang
            }`
          ),
        500
      );
  }, [user, stage, persistedState]);

  useEffect(() => {
    privyReady &&
      authenticated &&
      user &&      
      signFn &&
      stage === EStage.confirmed &&
      auth(user.wallet?.address!, signFn);
  }, [stage, arReady, privyReady, authenticated, user, signFn]);

  useEffect(() => {
    console.log(privyReady ,
      isReady ,
      arReady ,
      user ,
      authenticated ,
      persistedState ,
      stage === EStage.confirmed)

    privyReady &&
      isReady &&
      arReady &&
      user &&
      authenticated &&
      persistedState &&
      stage === EStage.confirmed &&
      setStage(
        // @ts-ignore
        persistedState.users[getArWallet(user.wallet?.address!)?.address].currentGang
          ? EStage.game
          : EStage.gangSelection
      );
  }, [privyReady, user, arReady, stage, isReady, persistedState, arReady]);

  return (
    <Flex
      width={"100%"}
      flexDirection={"column"}
      alignItems={"center"}
      padding={"1rem"}
      height={"100vh"}
    >
      <Button
        onClick={privyReady && authenticated ? () => setStage(EStage.confirmed) : login}
        isLoading={
          !privyReady || !isReady || isModalOpen || (stage === EStage.confirmed && !arReady)
        }
        variant={"accent"}
        transition={".2s"}
        size={"lg"}
        px={"5rem"}
        position={"fixed"}
        bottom={stage !== EStage.initial && arReady ? "-5rem" : "20vh"}
        zIndex={"99999"}
      >
        GANG IN
      </Button>
    </Flex>
  );
}
