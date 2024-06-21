"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  ScaleFade,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import useRouter, { ERouterPaths } from "@/features/useRouter";
import UserCount from "@/components/icons/UserCount";
import { CheckCircleIcon, ChevronLeftIcon } from "@chakra-ui/icons";
import TargetIcon from "@/components/icons/Target";
import InviteIcon from "@/components/icons/Invite";
import RewardIcon from "@/components/icons/Reward";
import { AnimatedCounter } from "@/components/Counter";
import useCheckin from "@/features/useCheckin";
import useUser from "@/features/useUser";
import useGangs from "@/features/useGangs";
import useInvite from "@/features/useInvite";

export default function Page() {
  const { router, push: routerPush } = useRouter();

  const gangId = router.query.id as string;

  const {
    ready,
    isLoading,
    login,
    authenticated,
    currentUser,
    currentUserScore,
    setGang: setUserGang,
    isWriting: isWritingUser,
    loadCurrentUser,
  } = useUser();
  const { ready: checkinReady, checkin, currentCheckin } = useCheckin({ gangIds: [gangId] });
  const { copyInviteLink, hasCopiedInviteLink } = useInvite();
  const { gangMetadata, getGangImageUrl, gangs } = useGangs({ gangIds: [gangId] });
  const currentGang = gangs?.[gangId];
  const currentGangMetadata = currentGang && gangMetadata?.[currentGang.id];

  const {
    isOpen: isJoinGangModalOpen,
    onOpen: onJoinGangModalOpen,
    onClose: onJoinGangModalClose,
  } = useDisclosure();

  const onRaidButtonClick = () =>
    login().then(() => routerPush(ERouterPaths.RAID_OPPONENT_SELECTION));

  const onJoinGangButtonClick = () =>
    currentUser?.currentGang && currentUser.currentGang !== gangId
      ? onJoinGangModalOpen()
      : joinGang();

  const joinGang = () => (setUserGang(gangId), onJoinGangModalClose());

  // console.log(currentUser, "USER", isLoading, currentGangMetadata)

  return !isLoading && currentGangMetadata ? (
    <Flex width={"100%"} flexDirection={"column"} alignItems={"center"} padding={"1rem"}>
      <Container
        h={"20vh"}
        w={"100vw"}
        top={0}
        left={0}
        pos={"absolute"}
        overflow={"hidden"}
        overflowY={"hidden"}
        maxW={"none"}
        borderRadius={"0 0 30px 30px"}
      >
        <Button
          onClick={() => routerPush(ERouterPaths.GANGS)}
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
        <Flex
          height={"20vh"}
          overflow={"hidden"}
          pos={"fixed"}
          top={0}
          left={0}
          width={"100vw"}
          borderRadius={"0 0 30px 30px"}
        >
          <Image
            src={getGangImageUrl(currentGangMetadata)}
            w={"150vw"}
            pos={"absolute"}
            top={0}
            left={"50vw"}
            maxW={"none"}
            transform={"translate(-50%, -50%)"}
          ></Image>
        </Flex>
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
          border={"2px solid black"}
        ></Container>
      </Container>
      <Container mt={"20vh"} pos={"absolute"} top={0}>
        <Flex mt={"-2.5rem"} px={"1.5rem"}>
          <Flex flexDir={"column"} gap={".25rem"} alignItems={"center"}>
            <Image
              //@ts-ignore
              src={getGangImageUrl(currentGangMetadata)}
              w={"5rem"}
              h={"5rem"}
              borderRadius={"full"}
              border={"4px solid black"}
              bg={"black"}
            ></Image>
          </Flex>
          <Flex flexDir={"column"} gap={".25rem"} pl={".5rem"}>
            <Text color={"black"} fontWeight={"bold"} fontSize={"2rem"} mt={"-.25rem"}>
              {currentGangMetadata.name}
            </Text>
            <Flex gap={".25rem"} align={"center"}>
              <UserCount />
              <Text fontWeight={"bold"}>{currentGang.members.length}</Text>
            </Flex>
          </Flex>
        </Flex>
      </Container>
      <Flex
        mt={"calc(20vh + 3rem)"}
        flexDir={"column"}
        gap={"1rem"}
        px={"1rem"}
        w={"min(100%, 30rem)"}
      >
        {/* <Flex
          bg={"whiteAlpha.200"}
          p=".5rem 1.5rem"
          gap={"1rem"}
          alignItems={"center"}
          borderRadius={"xl"}
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
        </Flex> */}
        {currentUser?.currentGang === gangId ? (
          <Flex flexDir={"column"} gap={"1rem"}>
            <Flex gap={"1rem"}>
              <ScaleFade delay={0.1} in style={{ display: "flex", flex: 0.33 }}>
                <Button
                  onClick={checkin}
                  variant={"main"}
                  isDisabled={currentCheckin?.hasCheckedIn}
                  isLoading={!checkinReady || currentCheckin?.isCheckingIn}
                  flex={1}
                  flexDir={"column"}
                  gap={"1rem"}
                >
                  <ScaleFade
                    in={!!currentCheckin?.checkinAmount}
                    style={{ position: "absolute", top: "-.5rem", left: "-.5rem" }}
                  >
                    <Flex
                      borderRadius={"full"}
                      border={"1px solid black"}
                      bg={"white"}
                      minW={"1.5rem"}
                      h="1.5rem"
                      p={".5rem"}
                      align={"center"}
                      justify={"center"}
                    >
                      <Text color={"black"} fontSize={".75rem"}>
                        {currentCheckin?.checkinAmount}
                      </Text>
                    </Flex>
                  </ScaleFade>
                  <Flex flexDir={"column"} align={"center"} gap={".5rem"}>
                    <Text>CHECK IN</Text>
                    {currentCheckin?.checkinAmount == 0 && (
                      <ScaleFade in>
                        <Flex gap={".25rem"} align={"baseline"}>
                          <Text color="accent">3X</Text>
                          <Text color="accent" fontSize={".75rem"}>
                            BOOST
                          </Text>
                        </Flex>
                      </ScaleFade>
                    )}
                    {currentCheckin?.hasCheckedIn && !!currentCheckin?.nextCheckinTime && (
                      <ScaleFade in>
                        <Text fontSize={".9rem"} color={"whiteAlpha.500"}>
                          in {currentCheckin?.nextCheckinTime}
                        </Text>
                      </ScaleFade>
                    )}
                  </Flex>

                  {/* <Switch size={"lg"}></Switch> */}
                </Button>
              </ScaleFade>
              <ScaleFade delay={0.2} in style={{ display: "flex", flex: 0.67 }}>
                <Button
                  variant={"main"}
                  // isDisabled={currentGangId !== gangId}
                  onClick={onRaidButtonClick}
                  borderRadius={"xl"}
                  justifyContent={"flex-start"}
                  alignItems={"flex-start"}
                  flex={1}
                  overflow={"hidden"}
                  fontSize={"1.25rem"}
                >
                  RAID
                  <Box
                    opacity={0.2}
                    pos={"absolute"}
                    right={"-2.5rem"}
                    top={"20%"}
                    transform={"rotateZ(20deg)"}
                  >
                    <TargetIcon />
                  </Box>
                </Button>
              </ScaleFade>
            </Flex>
            <Flex gap={"1rem"}>
              <ScaleFade delay={0.3} in style={{ display: "flex", flex: 0.67 }}>
                <Button
                  onClick={() => routerPush(ERouterPaths.LOTTERY)}
                  flex={1}
                  overflow={"hidden"}
                  borderRadius={"xl"}
                  variant={"main"}
                  justifyContent={"flex-start"}
                  alignItems={"flex-start"}
                >
                  <Flex flexDir={"column"} align={"flex-start"}>
                    <Text fontSize={"1rem"}>FEELIN&apos;</Text>
                    <Text fontSize={"1.5rem"}>LUCKY</Text>
                  </Flex>

                  <Box opacity={0.2} pos={"absolute"} right={"-2.5rem"} bottom={"-20%"}>
                    <RewardIcon />
                  </Box>
                </Button>
              </ScaleFade>
              <ScaleFade delay={0.4} in style={{ display: "flex", flex: 0.33 }}>
                <Button
                  onClick={() => copyInviteLink(currentGang.id)}
                  flex={1}
                  borderRadius={"xl"}
                  overflow={"hidden"}
                  variant={"main"}
                  p={0}
                  flexDir={"column"}
                  alignContent={"center"}
                  justifyContent={"center"}
                  gap={".5rem"}
                >
                  {hasCopiedInviteLink && (
                    <ScaleFade in>
                      <InviteIcon />
                    </ScaleFade>
                  )}
                  <Text
                    zIndex={1}
                    lineHeight={"1rem"}
                    fontWeight={"bold"}
                    fontSize={hasCopiedInviteLink ? ".75rem" : "1rem"}
                  >
                    {hasCopiedInviteLink && (
                      <ScaleFade in>
                        <Flex flexDir={"column"} gap={".5rem"} alignItems={"center"}>
                          <CheckCircleIcon color={"#6EFEC2"} boxSize={7}></CheckCircleIcon>
                          <Text>link copied</Text>
                        </Flex>
                      </ScaleFade>
                    )}
                    {/* {!hasCopiedInviteLink && (
                      <ScaleFade in>
                        <Text opacity={0.8} fontSize={".9rem"}>
                          {refAmount} REFS
                        </Text>
                      </ScaleFade>
                    )} */}
                  </Text>
                </Button>
              </ScaleFade>
            </Flex>
          </Flex>
        ) : (
          <Button
            onClick={onJoinGangButtonClick}
            variant={"accent"}
            size={"lg"}
            px={"5rem"}
            zIndex={"99999"}
          >
            GANG IN
          </Button>
        )}
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
        {/* <ScaleFade in>
          <Button
            isDisabled={currentGangId == router.query.id}
            isLoading={!currentGangId}
            onClick={() =>
              router.push({
                pathname: `/[vendor]/gang/${currentGangId}`,
                query: { vendor: router.query.vendor || "main" },
              })
            }
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
        </ScaleFade> */}
        {/* <CircularProgress
          value={gangScoreProgress.get()}
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
              <Text fontWeight={"bold"}>{gangScore}</Text>
              <Text>LVL {~~(gangScore / GANG_LEVEL_STEP) + 1}</Text>
            </Flex>
          </CircularProgressLabel>
        </CircularProgress> */}
        <ScaleFade in>
          <Flex flexDir={"column"} gap={".5rem"} justify={"center"} align={"center"}>
            {/* {!!gangTokenBalance && (
              <Flex gap={".5rem"} align={"center"} justify={"center"}>
                <WalletIcon></WalletIcon>
                <Text fontWeight={"bold"} fontSize={"1.25rem"}>
                  {(+formatEther(gangTokenBalance)).toFixed(2)}
                </Text>
              </Flex>
            )} */}
            <ScaleFade in={!!currentUserScore}>
              <AnimatedCounter value={currentUserScore || 0} color="fg" fontSize="2rem" />
            </ScaleFade>
          </Flex>
        </ScaleFade>

        {/* <ScaleFade in>
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
                  onClick={logout}
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
                      // fontSize={processes.includes(EProcess.inviting) ? ".75rem" : "1rem"}
                    >
                      Logout
                    </Text>
                  </Flex>
                </Button>
              </Flex>
            </MenuList>
          </Menu>
        </ScaleFade> */}
      </Flex>
      <Modal onClose={onJoinGangModalClose} isOpen={isJoinGangModalOpen} isCentered size={"sm"}>
        <ModalOverlay bg="none" backdropFilter="auto" backdropBlur="2px" />
        <ModalContent bg={"black"}>
          <ModalCloseButton />
          <ModalBody>
            <Text>To raid you&apos;ll have to join this gang first.</Text>
            <Text>Penalty for leaving your current gang is 15%</Text>
          </ModalBody>
          <ModalFooter justifyContent={"space-around"}>
            <Button bg={"white"} color={"black"} onClick={joinGang}></Button>
            <Button onClick={onJoinGangModalClose} isLoading={false} isDisabled={true}>
              Nah
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  ) : (
    <Spinner
      pos={"fixed"}
      w={"2rem"}
      h={"2rem"}
      top={"calc(50%  - 1rem)"}
      left={"calc(50%  - 1rem)"}
    ></Spinner>
  );
}

enum EProcess {
  inviting,
  settingCurrentGang,
  hasSetCurrentGang,
  checkingIn,
}

// const {
//   data: gangTokenBalance,
//   error,
//   status,
// } = useReadContract({
//   //@ts-ignore
//   address: GANGS.filter(({ id }) => id == gangId)[0]?.address,
//   abi: parseAbi(["function balanceOf(address owner) view returns (uint256)"]),
//   functionName: "balanceOf",
//   args: [user?.wallet?.address as Address],
//   chainId: 5000,
// });
