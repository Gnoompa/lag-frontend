import { useMemo } from "react";
import { Container, Flex, Image, Text, Button } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { sortBy } from "lodash";
import useRouter, { ERouterPaths } from "@/features/useRouter";
import useGangs from "@/features/useGangs";
import { EActivityTypes } from "lag-types";
import useUser from "@/features/useUser";

export default function Page() {
  const { push: routerPush } = useRouter();

  const { currentUser } = useUser();
  const { gangs, gangMetadata } = useGangs({ fetch: true });

  const rivalGangs = useMemo(
    () =>
      sortBy(gangs, (gang) => -gang?.score[EActivityTypes.GANG]).filter(
        (gang) => gang.id != currentUser?.currentGang
      ),
    [gangs]
  );

  return (
    <Flex width={"100%"} flexDirection={"column"} alignItems={"center"} padding={"1rem"}>
      <AnimatePresence>
        <motion.div
          initial={{ y: 300, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -300, opacity: 0 }}
        >
          <Text variant={"accent"} fontSize={"3rem"}>
            RAID
          </Text>
        </motion.div>
      </AnimatePresence>
      <Flex flexDir={"column"} gap={"1rem"} w={"100%"} mt={"2rem"}>
        <Flex flexDir={"column"} gap={"1rem"} alignItems={"center"}>
          <AnimatePresence>
            {rivalGangs?.map((gang, gangIndex) => (
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
                  <Button
                    variant={"secondary"}
                    onClick={() => routerPush(ERouterPaths.RAID, gang.id)}
                  >
                    RAID
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
