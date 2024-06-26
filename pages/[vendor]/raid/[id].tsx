import {
  Button,
  CircularProgress,
  CircularProgressLabel,
  Flex,
  IconButton,
  Image,
  ScaleFade,
  Text,
} from "@chakra-ui/react";
import { AnimatedCounter } from "@/components/Counter";
import { ENERGY_RESTORE_PER_SECOND, MAX_ENERGY } from "@/const";
import { ChevronLeftIcon } from "@chakra-ui/icons";
import useRouter, { ERouterPaths } from "@/features/useRouter";
import useRaid from "@/features/useRaid";
import useGangs from "@/features/useGangs";
import useUser from "@/features/useUser";

export default function Page() {
  const { router, push: routerPush } = useRouter();

  const opponentGangId = router?.query.id as string;

  const { currentUser } = useUser();
  const { spendEnergy, maxEnergy, energy, opponentGang, energyRechargeRate, score, sessionScore } =
    useRaid(opponentGangId);
  const { getGangImageUrl, gangMetadata } = useGangs({ gangIds: [opponentGangId] });

  const onRivalGangIconTap = () => {
    spendEnergy(100);

    // @ts-ignore
    global.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
  };

  return (
    <Flex width={"100%"} flexDirection={"column"} alignItems={"center"} padding={"1rem"}>
      <Flex justifyContent={"center"}>
        <ScaleFade in>
          <Flex justify={"center"}>
            <Flex
              top={"2rem"}
              pos={"fixed"}
              width={["60vw", "min(100%, 15rem)"]}
              height={["60vw", "min(100%, 15rem)"]}
              maxWidth={"20vh"}
              align={"center"}
              justify={"center"}
            >
              <CircularProgress
                value={energy && maxEnergy ? 100 - (100 * (maxEnergy - energy)) / MAX_ENERGY : 0}
                color="red"
                w={"100%"}
                h={"100%"}
                size={"100%"}
              >
                <CircularProgressLabel>
                  <Image
                    style={{
                      transition: ".2s",
                      // transform: `scale(${scoreAnimationToggle ? 1.1 : 1})`,
                    }}
                    src={gangMetadata && getGangImageUrl(gangMetadata[opponentGangId])}
                    filter={`grayscale(${energy ? (MAX_ENERGY - energy) / MAX_ENERGY : 0})`}
                    margin={"0 auto"}
                    width={["80%"]}
                    borderRadius={"full"}
                    boxShadow={"0 20px 100px red"}
                    zIndex={1}
                  ></Image>
                </CircularProgressLabel>
              </CircularProgress>
            </Flex>
          </Flex>
        </ScaleFade>
        <span
          onMouseDown={onRivalGangIconTap}
          style={{
            userSelect: "none",
            position: "fixed",
            width: "100%",
            height: "100vh",
            bottom: 0,
            zIndex: 1,
          }}
        ></span>
      </Flex>
      <Flex
        flexDir={"column"}
        gap={"1rem"}
        w={"100%"}
        height={"calc(100svh - 2rem)"}
        pos={"relative"}
        alignItems={"center"}
      >
        <Flex
          flexDir={"column"}
          gap={"1.5rem"}
          alignItems={"center"}
          pos={"absolute"}
          bottom={"2rem"}
          zIndex={1}
          w={"100%"}
        >
          <Flex w={"100%"} alignItems={"center"} justifyContent={"space-between"} px={".5rem"}>
            <ScaleFade in>
              <IconButton
                // onClick={() => routePush(ERouterPaths.GANG, currentUser?.currentGang)}
                aria-label="back"
                icon={<ChevronLeftIcon boxSize={10} />}
                variant={"unstyled"}
                color={"fg"}
              />
            </ScaleFade>
            <Flex
              gap={".5rem"}
              w={"100%"}
              justifyContent={"center"}
              flexDir={"column"}
              align={"center"}
            >
              <ScaleFade in={score !== undefined}>
                <AnimatedCounter value={score as number} color="white" fontSize="2rem" />
              </ScaleFade>

              <Flex flexDir={"column"} gap={".25rem"} alignItems={"center"}>
                <Flex gap={".25rem"} alignItems={"center"}>
                  <ScaleFade in={energy !== undefined}>
                    <Text fontWeight={"bold"} opacity={0.8} color={"fg"}>
                      Energy {Math.round(energy!)} ({energyRechargeRate?.toFixed(1)} p/s)
                    </Text>
                  </ScaleFade>
                </Flex>
              </Flex>
            </Flex>
            <Flex w={"2rem"}></Flex>
          </Flex>
        </Flex>
      </Flex>
      <ScaleFade
        in={energy !== undefined && energy < 1000}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backdropFilter: "blur(100px)",
          zIndex: energy !== undefined && energy < 1000 ? 2 : 0,
        }}
      >
        <Flex
          pos={"fixed"}
          w={"100vw"}
          h={"100vh"}
          top={0}
          left={0}
          flexDir={"column"}
          justify={"center"}
          align={"center"}
          gap={"10vh"}
        >
          <Flex flexDir={"column"} gap={"1rem"}>
            {!!sessionScore && (
              <Flex flexDir={"column"}>
                <Text fontSize={"3rem"} fontWeight={"bold"}>
                  {sessionScore || 0}
                </Text>
                <Text>AP EARNED</Text>
              </Flex>
            )}
            {/* {!!stolenEnergy && (
              <Flex flexDir={"column"}>
                <Text fontSize={"3rem"} fontWeight={"bold"}>
                  {stolenEnergy || 0}
                </Text>
                <Text>AP STOLEN</Text>
              </Flex>
            )} */}
          </Flex>
          <Flex flexDir={"column"} gap={".25rem"}>
            <Button onClick={() => routerPush(ERouterPaths.GANG, currentUser?.currentGang)}>
              chill
            </Button>
            <Text fontSize={".75rem"} opacity={0.5}>
              full energy every 60m
            </Text>
          </Flex>
        </Flex>
      </ScaleFade>
    </Flex>
  );
}

{
  /* <ScaleFade in>
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
    <HamburgerIcon boxSize={6} color={"fg"} />
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
        onClick={logout}
        bg={"black"}
        p={"1rem"}
        w={"5rem"}
        h={"5rem"}
        _hover={{ bg: "black" }}
      >
        <Flex flexDir={"column"} gap={".5rem"} align={"center"}>
          <Text
            lineHeight={"1rem"}
            fontWeight={"bold"}
            // fontSize={process.includes(EProcess.inviting) ? ".75rem" : "1rem"}
          >
            Logout
          </Text>
        </Flex>
      </Button>
    </Flex>
  </MenuList>
</Menu>
</ScaleFade> */
}
