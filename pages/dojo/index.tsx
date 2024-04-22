import useWallet from "@/features/useWallet";
import { usePrivy } from "@privy-io/react-auth";
import { Button, Flex, Text } from "rebass";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import PrimaryButton from "@/components/PrimaryButton";
import useArweave from "@/features/useArweave";
import { useRouter } from "next/router";
import DojoIcon from "@/components/icons/Dojo";
import { Container, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import { useAtomValue } from "jotai";
import { arContractStateAtom, persistedPlayerScoreAtom } from "@/state";
import { orderBy } from "lodash";
import { useEffect, useState } from "react";
import { Address, createPublicClient, formatEther, getContract, http, parseAbi } from "viem";

import { mantle } from "viem/chains";

export default function Dojo() {
  const router = useRouter();

  const { user, signMessage, ready, authenticated, linkWallet, login } = usePrivy();

  const { wallet, lastLinkedExternalWallet } = useWallet();
  const { arWallet } = useArweave(wallet?.address);

  const arContractState = useAtomValue(arContractStateAtom);
  const persistedPlayerScore = useAtomValue(persistedPlayerScoreAtom);
  //@ts-ignore
  const leaderboard = orderBy(arContractState?.users, "score", "desc");

  const [claimedAmount, setClaimedAmount] = useState<number>();
  const [isClaiming, setIsClaiming] = useState(false);

  const claimableAmount =
    persistedPlayerScore && claimedAmount !== undefined
      ? persistedPlayerScore - claimedAmount
      : undefined;

  useEffect(() => {
    wallet && fetchClaims(wallet.address as Address);
  }, [wallet]);

  const fetchClaims = async (address: Address) => {
    getContract({
      address: "0x89de51641d0f9A98d5D118b18d75A112F5F8138b",
      abi: parseAbi(["function claims(address target) view returns(uint256)"]),
      client: createPublicClient({
        chain: mantle,
        transport: http(),
      }),
    })
      .read.claims([address])
      .catch(console.error)
      // @ts-ignore
      .then((res) => setClaimedAmount(+formatEther(res.toString())));
  };

  const claim = async () => {
    setIsClaiming(true);

    fetch("/api/sign", {
      method: "POST",
      body: JSON.stringify({
        arAddress: arWallet?.address,
        evmAddress: wallet?.address,
      }),
    })
      .then(() => setClaimedAmount(claimableAmount || 0))
      .finally(() => setIsClaiming(false));
  };

  return (
    <Flex flexDirection={"column"} style={{ gap: "4rem" }} alignItems={"center"} p={"2rem"}>
      <Flex style={{ gap: "1rem" }} alignItems={"center"}>
        <DojoIcon style={{ width: "2.5rem", height: "2.5rem" }} />
        <Text className="accentText" fontWeight={"600"} fontSize={"2rem"} textAlign={"center"}>
          DOJO
        </Text>
      </Flex>
      <Tabs display={"flex"} flexDir={"column"} alignItems={"center"}>
        <TabList mb={"2rem"}>
          <Tab>
            <Text className="accentText">Journey</Text>
          </Tab>
          <Tab>
            <Text className="accentText">Claim</Text>
          </Tab>
          <Tab>
            <Text className="accentText">Leaders</Text>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel gap={"2rem"} display={"flex"} flexDir={"column"}>
            <Flex flexDirection={"column"} style={{ gap: ".5rem" }} alignItems={"center"}>
              <Flex alignItems={"center"} style={{ gap: "1rem" }}>
                <Text fontSize={"1.75rem"} fontWeight={"bold"}>
                  NEWBIE
                </Text>
                <svg
                  width="20"
                  height="23"
                  viewBox="0 0 20 23"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1.18454 3.92884C1.32164 1.72158 3.19616 0 5.46241 0H15.7143C18.0812 0 20 1.87226 20 4.18182V23H18.5714L10.4821 16.9625L1.42857 23H0L1.18454 3.92884Z"
                    fill="url(#paint0_linear_347_3005)"
                  />
                  <path
                    d="M0 4.18182C0 1.87226 1.91878 0 4.28571 0H14.2857C16.6526 0 18.5714 1.87226 18.5714 4.18182V23L9.05357 16.9625L0 23V4.18182Z"
                    fill="url(#paint1_linear_347_3005)"
                  />
                  <path
                    d="M0.714286 4.87879C0.714286 2.56923 2.63307 0.69697 5 0.69697H13.5714C15.9384 0.69697 17.8571 2.56923 17.8571 4.87879V21.6061L9.07143 16.1174L0.714286 21.6061V4.87879Z"
                    fill="url(#paint2_linear_347_3005)"
                  />
                  <path
                    d="M3.57143 8.36364C3.57143 7.97871 3.89123 7.66667 4.28571 7.66667H14.2857C14.6802 7.66667 15 7.97871 15 8.36364V9.06061C15 9.44553 14.6802 9.75758 14.2857 9.75758H4.28571C3.89123 9.75758 3.57143 9.44553 3.57143 9.06061V8.36364Z"
                    fill="#111111"
                  />
                  <defs>
                    <linearGradient
                      id="paint0_linear_347_3005"
                      x1="10.7143"
                      y1="0"
                      x2="10.7143"
                      y2="23"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stop-color="#B98200" />
                      <stop offset="1" stop-color="#663100" />
                    </linearGradient>
                    <linearGradient
                      id="paint1_linear_347_3005"
                      x1="10"
                      y1="0"
                      x2="10"
                      y2="23"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stop-color="#FED471" />
                      <stop offset="1" stop-color="#FF7A00" />
                    </linearGradient>
                    <linearGradient
                      id="paint2_linear_347_3005"
                      x1="10"
                      y1="0"
                      x2="10"
                      y2="23"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stop-color="#FED471" />
                      <stop offset="1" stop-color="#FF7A00" />
                    </linearGradient>
                  </defs>
                </svg>
              </Flex>
              <svg
                width="339"
                height="19"
                viewBox="0 0 339 19"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="1"
                  y="1"
                  width="337"
                  height="17"
                  rx="8.5"
                  fill="url(#paint0_linear_347_2984)"
                  stroke="url(#paint1_linear_347_2984)"
                  stroke-width="2"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_347_2984"
                    x1="2"
                    y1="9.5"
                    x2="337"
                    y2="9.5"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0.05" stop-color="#FFA243" />
                    <stop offset="0" stop-color="#111111" />
                  </linearGradient>
                  <linearGradient
                    id="paint1_linear_347_2984"
                    x1="2"
                    y1="9.5"
                    x2="337"
                    y2="9.5"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#FFD786" />
                    <stop offset="1" stop-color="#CA8801" stop-opacity="0.54" />
                  </linearGradient>
                </defs>
              </svg>
              <Text opacity={0.5} fontWeight={"bold"}>
                0 / 1000
              </Text>
            </Flex>
            <Flex flexDirection={"column"}>
              <Container
                display={"flex"}
                justifyContent={"space-between"}
                flexDir={"row"}
                bg={
                  "linear-gradient(111.77deg, rgba(254, 212, 113, 0.3) -16.98%, rgba(0, 0, 0, 0.3) 111.71%)"
                }
                borderRadius={"12px"}
                p={".5rem 1.5rem"}
                border={"1px solid #ffffff36"}
                backdropFilter={"blur(10px)"}
              >
                <Flex flexDirection={"column"}>
                  <Text fontWeight={"bold"}>My path</Text>
                  <Text fontSize={"0.75rem"}>Stage - 1</Text>
                </Flex>
                <Flex alignItems={"center"} style={{ gap: ".5rem" }}>
                  <Text color={"#FED471"}>0</Text>
                  <svg
                    width="10"
                    height="12"
                    viewBox="0 0 10 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0.592272 2.04983C0.66082 0.898216 1.59808 0 2.7312 0H7.85714C9.04061 0 10 0.976833 10 2.18182V12H9.28571L5.24107 8.85L0.714286 12H0L0.592272 2.04983Z"
                      fill="url(#paint0_linear_408_976)"
                    />
                    <path
                      d="M0 2.18182C0 0.976833 0.95939 0 2.14286 0H7.14286C8.32632 0 9.28571 0.976833 9.28571 2.18182V12L4.52679 8.85L0 12V2.18182Z"
                      fill="url(#paint1_linear_408_976)"
                    />
                    <path
                      d="M0.357143 2.54545C0.357143 1.34047 1.31653 0.363636 2.5 0.363636H6.78571C7.96918 0.363636 8.92857 1.34047 8.92857 2.54545V11.2727L4.53571 8.40909L0.357143 11.2727V2.54545Z"
                      fill="url(#paint2_linear_408_976)"
                    />
                    <defs>
                      <linearGradient
                        id="paint0_linear_408_976"
                        x1="5.35714"
                        y1="0"
                        x2="5.35714"
                        y2="12"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stop-color="#B98200" />
                        <stop offset="1" stop-color="#663100" />
                      </linearGradient>
                      <linearGradient
                        id="paint1_linear_408_976"
                        x1="5"
                        y1="0"
                        x2="5"
                        y2="12"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stop-color="#FED471" />
                        <stop offset="1" stop-color="#FF7A00" />
                      </linearGradient>
                      <linearGradient
                        id="paint2_linear_408_976"
                        x1="4.64286"
                        y1="0.363636"
                        x2="4.64286"
                        y2="11.2727"
                        gradientUnits="userSpaceOnUse"
                      >
                        <stop stop-color="#FED471" />
                        <stop offset="1" stop-color="#FF7A00" />
                      </linearGradient>
                    </defs>
                  </svg>
                </Flex>
              </Container>
            </Flex>
          </TabPanel>
          <TabPanel display={"flex"} alignItems={"center"} flexDir={"column"} gap={"1rem"}>
            {claimableAmount !== undefined && (
              <Text
                className="accentText"
                fontWeight={"BOLD"}
                fontSize={"1.5rem"}
                textAlign={"center"}
              >
                CLAIMABLE: {claimableAmount}
              </Text>
            )}
            {!!claimedAmount && (
              <Text
                className="accentText"                
                fontWeight={"BOLD"}
                fontSize={"1.5rem"}
                textAlign={"center"}
                opacity={.7}
              >
                CLAIMED: {claimedAmount}
              </Text>
            )}
            {ready && authenticated && (
              <Button onClick={claim} bg={"transparent"} disabled={!claimableAmount || isClaiming}>
                <PrimaryButton width="100%">{isClaiming ? "CLAIMING" : "CLAIM"}</PrimaryButton>
              </Button>
            )}
            {ready && !authenticated && (
              <Button onClick={login} bg={"transparent"}>
                <PrimaryButton>CONNECT</PrimaryButton>
              </Button>
            )}
          </TabPanel>
          <TabPanel gap={"1rem"} display={"flex"} flexDir={"column"}>
            {leaderboard &&
              leaderboard.map((user, key) => (
                <Container
                  key={key}
                  display={"flex"}
                  maxW={"100vw"}
                  gap={"8rem"}
                  justifyContent={"space-between"}
                  flexDir={"row"}
                  // bg={"linear-gradient(111.77deg, #02B1AA -16.98%, rgba(0, 0, 0, 0.3) 111.71%)"}
                  borderRadius={"12px"}
                  p={".5rem 1.5rem"}
                  border={"1px solid #ffffff36"}
                  backdropFilter={"blur(10px)"}
                >
                  <Flex style={{ gap: "1rem" }}>
                    <Text>{key + 1}</Text>
                    <Text fontWeight={"bold"}>
                      {user.evmAddress.substring(0, 6)}..{user.evmAddress.substring(6, 10)}
                    </Text>
                  </Flex>
                  <Flex alignItems={"center"} style={{ gap: ".5rem" }}>
                    <Text>{user.score}</Text>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 5.21739C10 7.85875 7.89539 10 5.29922 10C2.70306 10 0.598448 7.85875 0.598448 5.21739C0.598448 2.57603 2.70306 0.434783 5.29922 0.434783C7.89539 0.434783 10 2.57603 10 5.21739Z"
                        fill="url(#paint0_linear_412_1195)"
                      />
                      <path
                        d="M9.40155 4.78261C9.40155 7.42397 7.29694 9.56522 4.70078 9.56522C2.10461 9.56522 0 7.42397 0 4.78261C0 2.14125 2.10461 0 4.70078 0C7.29694 0 9.40155 2.14125 9.40155 4.78261Z"
                        fill="url(#paint1_linear_412_1195)"
                      />
                      <defs>
                        <linearGradient
                          id="paint0_linear_412_1195"
                          x1="5"
                          y1="0"
                          x2="5"
                          y2="10"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stop-color="#02B1AA" />
                          <stop offset="1" stop-color="#00504D" />
                        </linearGradient>
                        <linearGradient
                          id="paint1_linear_412_1195"
                          x1="4.70078"
                          y1="0"
                          x2="4.70078"
                          y2="9.56522"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stop-color="#53FFD8" />
                          <stop offset="1" stop-color="#02B1AA" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </Flex>
                </Container>
              ))}
          </TabPanel>
        </TabPanels>
      </Tabs>
      <div
        style={{
          position: "fixed",
          width: "100%",
          height: "5rem",
          background: "linear-gradient(rgb(2 177 170 / 10%), transparent)",
          top: 0,
        }}
      />
    </Flex>
  );
}
