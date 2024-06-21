"use client";

import { Button, Container, Flex, Image, Text } from "@chakra-ui/react";
import useRouter, { ERouterPaths } from "@/features/useRouter";
import { motion, AnimatePresence } from "framer-motion";
import useGangs from "@/features/useGangs";
import { useMemo } from "react";
import { sortBy } from "lodash";
import { EActivityTypes } from "lag-types";

export default function Page() {
  const { router, push: routerPush } = useRouter();

  const { gangs, gangMetadata, getScore: getGangScore } = useGangs({ fetch: true });

  const sortedGangs = useMemo(
    () => sortBy(gangs, (gang) => -gang?.score[EActivityTypes.GANG]),
    [gangs]
  );

  return (
    <Flex width={"100%"} flexDirection={"column"} alignItems={"center"} padding={"1rem"}>
      <Flex flexDir={"column"} gap={"1rem"} w={"100%"} mt={"2rem"}>
        <Flex flexDir={"column"} gap={"1rem"} alignItems={"center"} pb={"4rem"}>
          <AnimatePresence>
            {sortedGangs?.map((gang, gangIndex) => (
              <motion.div
                key={gangIndex}
                style={{ width: "100%" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: gangIndex / 10 }}
              >
                <Container
                  onClick={() => routerPush(ERouterPaths.GANG, gang.id)}
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
                  <Text fontWeight={"bold"} fontSize={"1.25rem"} color={"black"}>
                    {~~getGangScore(gang)}
                  </Text>
                </Container>
              </motion.div>
            ))}
          </AnimatePresence>
        </Flex>
      </Flex>
      <Flex p={"1rem"} bg={"bg"} w={"100%"} pos={"fixed"} h={"4.5rem"} bottom={"0"}>
        <Button
          onClick={() => routerPush(ERouterPaths.CREATE_GANG)}
          variant={"accent"}
          m={"0 auto"}
          size={"sm"}
          bg={"bg"}
          color={"fg"}
          borderColor={"fg"}
          px={"2rem"}
          zIndex={"99999"}
        >
          LAUNCH GANG
        </Button>
      </Flex>
    </Flex>
  );
}
