"use client";

import { useEffect, useState } from "react";
import { Container, Flex, Image, Text, Button } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ERC20_TOKENS } from "@/const";
import { IGang } from "@/typings";
import { motion, AnimatePresence } from "framer-motion";
import useArweave from "@/features/useArweave";
import { sortBy, without } from "lodash";
import { usePrivy } from "@privy-io/react-auth";
import useWallet from "@/features/useWallet";
import { useAtom, useAtomValue } from "jotai";
import { persistedGlobalScoreAtom, persistedPlayerStateAtom } from "@/state";

export enum EStage {
  initial,
  game,
}

export default function Page() {
  enum EProcess {
    settingCurrentGang,
  }

  const [process, setProcess] = useState<EProcess[]>([]);

  const router = useRouter();
  const { ready, user, login, authenticated } = usePrivy();
  const { signFn } = useWallet();
  const { write, ready: arReady, auth, isLoading } = useArweave(user?.wallet?.address);

  const [stage, setStage] = useState<EStage>(EStage.initial);

  const [allGangs, setAllGangs] = useState<IGang[]>([]);
  const persistedGlobalScore = useAtomValue(persistedGlobalScoreAtom);
  const [persistedPlayerState, setPersistedPlayerState] = useAtom(persistedPlayerStateAtom);
  const canGangIn = ready && user?.wallet?.address && authenticated && arReady;

  useEffect(() => {
    persistedGlobalScore &&
      setAllGangs(
        sortBy(
          ERC20_TOKENS.map((token) => ({
            image: token.image,
            name: token.label,
            // @ts-ignore
            score: persistedGlobalScore[token.id] || 0,
            id: token.id,
          })),
          "score"
        )
      );
  }, [persistedGlobalScore]);

  useEffect(() => {
    ready &&
      user?.wallet?.address &&
      authenticated &&
      signFn &&
      auth(user?.wallet?.address!, signFn);
  }, [ready, user, authenticated, signFn]);

  useEffect(() => {
    stage === EStage.game && setTimeout(() => router.push("g"));
  }, [stage]);

  const onJoinGangButtonClick = (gang: IGang) => {
    if (!user?.wallet?.address || !authenticated) {
      login();

      return;
    }

    if (!arReady) {
      auth(user?.wallet?.address, signFn!);

      return;
    }

    router.push(`/raid?id=${gang.id}`);
  };

  return (
    <Flex width={"100%"} flexDirection={"column"} alignItems={"center"} padding={"1rem"}>
      <AnimatePresence>
        {stage === EStage.initial && (
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -300, opacity: 0 }}
          >
            <Text variant={"accent"} fontSize={"3rem"}>
              RAID
            </Text>
          </motion.div>
        )}
      </AnimatePresence>
      <Flex flexDir={"column"} gap={"1rem"} w={"100%"} mt={"2rem"}>
        <Flex flexDir={"column"} gap={"1rem"} alignItems={"center"}>
          <AnimatePresence>
            {stage === EStage.initial &&
              allGangs?.map((gang, gangIndex) => (
                <motion.div
                  key={gangIndex}
                  style={{ width: "100%" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: gangIndex / 10 }}
                >
                  <Container
                    variant={"accent"}
                    display={"flex"}
                    justifyContent={"space-between"}
                    alignItems={"center"}
                  >
                    <Flex alignItems={"center"} gap={".5rem"}>
                      <Text color={"black"} fontWeight={"bold"} fontSize={"1.25rem"}>
                        #{gangIndex + 1}
                      </Text>
                      <Image
                        src={gang.image}
                        fallback={
                          <svg width="3rem" height="3rem" viewBox="0 0 309 309" fill="none">
                            <circle cx="154.5" cy="154.5" r="154.5" fill="black" />
                          </svg>
                        }
                        w={"3rem"}
                        height={"3rem"}
                      ></Image>
                      <Text color={"black"} fontWeight={"bold"}>
                        {gang.name}
                      </Text>
                    </Flex>
                    <Button
                      variant={"secondary"}
                      onClick={() => onJoinGangButtonClick(gang)}
                      isLoading={
                        process.includes(EProcess.settingCurrentGang) || !ready || isLoading
                      }
                    >
                      {!arReady ? "CONNECT" : "CALL OUT"}
                    </Button>
                  </Container>
                </motion.div>
              ))}
          </AnimatePresence>
        </Flex>
      </Flex>
    </Flex>
  );
}
