"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Container, Flex, Image, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { IGang } from "@/typings";
import { motion, AnimatePresence } from "framer-motion";
import useArweave from "@/features/useArweave";
import { forEach, sortBy, without } from "lodash";
import { usePrivy } from "@privy-io/react-auth";
import useWallet from "@/features/useWallet";
import { useAtom, useAtomValue } from "jotai";
import { persistedGlobalScoreAtom, persistedPlayerStateAtom, persistedStateAtom } from "@/state";

export enum EStage {
  initial,
  game,
}

export default function Page() {
  enum EProcess {
    settingCurrentGang,
  }

  const [processes, setProcesses] = useState<EProcess[]>([]);

  const router = useRouter();
  const { ready, user, login, authenticated } = usePrivy();
  const { signFn } = useWallet();
  const { write, ready: arReady, auth, isLoading } = useArweave(user?.wallet?.address);

  const [stage, setStage] = useState<EStage>(EStage.initial);

  const [allGangs, setAllGangs] = useState<IGang[]>([]);
  const [gangMetadata, setGangMetadata] = useState<{
    [gangId: string]: { name: string; ticker: string; image: string };
  }>();
  const gangMetadataRef = useRef(gangMetadata);
  const [currentGuildId, setCurrentGuildId] = useState<string>();
  const persistedGlobalScore = useAtomValue(persistedGlobalScoreAtom);
  const persistedState = useAtomValue(persistedStateAtom);
  const [persistedPlayerState, setPersistedPlayerState] = useAtom(persistedPlayerStateAtom);
  const canGangIn = ready && user?.wallet?.address && authenticated && arReady;

  useEffect(() => {
    persistedPlayerState &&
      // @ts-ignore
      setCurrentGuildId(persistedPlayerState?.currentGang);
  }, [persistedPlayerState]);

  useEffect(() => {
    persistedGlobalScore &&
      persistedState &&
      setAllGangs(
        sortBy(
          // @ts-ignore
          forEach(persistedState.gangs, (gang) => ({
            metadata: gang.metadata,
            // @ts-ignore
            score: persistedGlobalScore[gang.id] || 0,
            id: gang.id,
          })),
          "score"
        ).reverse()
      );
  }, [persistedState, persistedGlobalScore]);

  useEffect(() => {
    gangMetadataRef.current = gangMetadata;
  }, [gangMetadata]);

  useEffect(() => {
    allGangs?.map(
      (gang) =>
        !gangMetadata?.[gang.id] &&
        fetch(`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}ipfs/${gang.metadata}`)
          .then((res) => res.json())
          .then((metadata) =>
            setGangMetadata({
              ...gangMetadataRef.current,
              [gang.id]: metadata,
            })
          )
    );
  }, [allGangs]);

  useEffect(() => {
    ready &&
      user?.wallet?.address &&
      authenticated &&
      signFn &&
      auth(user?.wallet?.address!, signFn);
  }, [ready, user, authenticated, signFn]);

  useEffect(() => {
    stage === EStage.game &&
      // @ts-ignore
      persistedPlayerState?.currentGang &&
      // @ts-ignore
      setTimeout(() =>
        router.push({
          // @ts-ignore
          pathname: `/[vendor]/gang/${persistedPlayerState?.currentGang}`,
          query: { vendor: router.query.vendor || "main" },
        })
      );
  }, [stage, persistedPlayerState]);

  const onJoinGangButtonClick = (gang: IGang) => {
    if (!user?.wallet?.address || !authenticated) {
      login();

      return;
    }

    if (!arReady) {
      auth(user?.wallet?.address, signFn!);

      return;
    }

    setProcesses([...processes, EProcess.settingCurrentGang]);

    write({ function: "gang", gang: gang.id })
      .then(
        () => (
          setPersistedPlayerState({ ...persistedPlayerState, currentGang: gang.id }),
          setStage(EStage.game)
        )
      )
      .catch(() => alert("Oops, smth went wrong..."))
      .finally(() => setProcesses(without(processes, EProcess.settingCurrentGang)));
  };

  return (
    <Flex width={"100%"} flexDirection={"column"} alignItems={"center"} padding={"1rem"}>
      <AnimatePresence>
        {stage === EStage.initial && (
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -300, opacity: 0 }}
          ></motion.div>
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
                  {/* <Accordion variant={"unstyled"} allowMultiple>
                    <AccordionItem>
                      <AccordionButton> */}
                  <Container
                    onClick={() =>
                      router.push({
                        // @ts-ignore
                        pathname: `/[vendor]/gang/${gang.id}`,
                        query: { vendor: router.query.vendor || "main" },
                      })
                    }
                    cursor={"pointer"}
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
                        src={`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}ipfs/${
                          gangMetadata?.[gang.id]?.image
                        }`}
                        fallback={
                          <svg width="3rem" height="3rem" viewBox="0 0 309 309" fill="none">
                            <circle cx="154.5" cy="154.5" r="154.5" fill="black" />
                          </svg>
                        }
                        w={"3rem"}
                        height={"3rem"}
                      ></Image>
                      <Text color={"black"} fontWeight={"bold"}>
                        {gangMetadata?.[gang.id]?.name}
                      </Text>
                    </Flex>
                    {/* {process.includes(EProcess.settingCurrentGang) || !ready || isLoading ? (
                            <Spinner></Spinner>
                          ) : currentGuildId ? ( */}

                    <Text fontWeight={"bold"} fontSize={"1.25rem"} color={"black"}>
                      {gang.score}
                    </Text>
                    {/* ) : (                            
                            // <Button
                            //   variant={"secondary"}
                            //   onClick={() => onJoinGangButtonClick(gang)}
                            //   isLoading={
                            //     process.includes(EProcess.settingCurrentGang) || !ready || isLoading
                            //   }
                            // >
                            //   {!arReady ? "CONNECT" : "GANG IN"}
                            // </Button>
                          // )} */}
                  </Container>
                  {/* </AccordionButton>
                      <AccordionPanel display={"flex"} justifyContent={"center"}> */}
                  {/* <Button
                          variant={"secondary"}
                          bg={"white"}
                          color={"black"}
                          onClick={() => onJoinGangButtonClick(gang)}
                          isLoading={
                            process.includes(EProcess.settingCurrentGang) || !ready || isLoading
                          }
                        >
                          {!arReady ? "CONNECT" : "GANG IN"}
                        </Button> */}
                  {/* </AccordionPanel>
                    </AccordionItem>
                  </Accordion> */}
                </motion.div>
              ))}
          </AnimatePresence>
        </Flex>
      </Flex>
      <Flex p={"1rem"} bg={"bg"} w={"100%"} pos={"fixed"} h={"4.5rem"} bottom={"0"}>
        <Button
          onClick={() =>
            router.push({
              pathname: `/[vendor]/launch`,
              // @ts-ignore
              query: { vendor: router.query.vendor || "main" },
            })
          }
          variant={"accent"}
          m={"0 auto"}
          size={"sm"}
          bg={"bg"}
          color={"fg"}
          borderColor={"fg"}
          px={"2rem"}
          zIndex={"99999"}
        >
          🚀 LAUNCH TOKEN
        </Button>
      </Flex>
    </Flex>
  );
}
