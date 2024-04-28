"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Flex } from "@chakra-ui/react";
import { ERC20_TOKENS } from "@/const";
import useBubbleMap from "@/features/useBubbleMap";
import { useRouter } from "next/router";
import useArweave from "@/features/useArweave";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useAtom } from "jotai";
import { persistedPlayerStateAtom } from "@/state";

export enum EStage {
  initial,
  gangSelection,
  game,
  confirmed,
}

export default function Page() {
  const router = useRouter();

  const { ready, user, authenticated, isModalOpen } = usePrivy();
  const { login } = useLogin({
    onComplete(user, isNewUser: boolean, wasAlreadyAuthenticated: boolean) {
      !wasAlreadyAuthenticated && setStage(EStage.confirmed);
    },
  });
  const { ready: arReady, getArWallet } = useArweave(user?.wallet?.address);

  const [persistedPlayerState, setPersistedPlayerState] = useAtom(persistedPlayerStateAtom);

  const [stage, setStage] = useState<EStage>();

  const bubbleMapTransform = useMemo(
    () => ({
      y: stage === EStage.confirmed ? -window.innerHeight : 0,
      opacity: 0
    }),
    [stage]
  );

  const bubbleMap = useBubbleMap(
    [
      ...ERC20_TOKENS,
      {
        label: "",
        image: "/banner1.svg",
        value: 200,
      },
      {
        label: "",
        image: "/banner2.svg",
        value: 125,
      },
      {
        label: "",
        image: "/banner3.svg",
        value: 150,
      },
      {
        label: "",
        image: "/banner4.svg",
        value: 175,
      },
    ],
    bubbleMapTransform
  );

  useEffect(() => {
    setTimeout(() => setStage(EStage.initial), 100);

    // @ts-ignore
    global?.Telegram?.WebApp?.ready();
  }, []);

  useEffect(() => {
    stage === EStage.gangSelection && setTimeout(() => router.push("gangs"), 500);
    stage === EStage.game && setTimeout(() => router.push("g"), 500);
  }, [stage]);

  useEffect(() => {
    ready &&
      user &&
      authenticated &&
      stage === EStage.confirmed &&
      setStage(getArWallet(user.wallet?.address!) ? EStage.game : EStage.gangSelection);
  }, [ready, user, arReady, stage]);

  return (
    <Flex
      width={"100%"}
      flexDirection={"column"}
      alignItems={"center"}
      padding={"1rem"}
      height={"100vh"}
    >
      <Button
        onClick={ready && authenticated ? () => setStage(EStage.confirmed) : login}
        isLoading={!ready || isModalOpen}
        variant={"accent"}
        transition={".2s"}
        size={"lg"}
        px={"5rem"}
        position={"fixed"}
        bottom={stage !== EStage.initial ? "-5rem" : "20vh"}
        zIndex={"99999"}
      >
        GANG IN
      </Button>
    </Flex>
  );
}
