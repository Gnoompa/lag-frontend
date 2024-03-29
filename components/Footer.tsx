"use client";

import { Button, Flex, Text } from "rebass";
import { scoreAtom, spoiceAtom } from "../app/state";
import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import QRCode from "react-qr-code";
import { useAtomValue } from "jotai";

export function Footer() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  const [isExpanded, setIsExpanded] = useState(false);

  const spoice = useAtomValue(spoiceAtom);
  const score = useAtomValue(scoreAtom);

  // console.log(score)

  const wallet = user?.wallet;

  return (
    <Flex
      backgroundColor={"#4C3827"}
      p={".5rem 1rem"}
      style={{ position: "fixed", bottom: 0, width: "100%" }}
    >
      <Flex
        justifyContent={isExpanded ? "center" : "space-between"}
        width={"100%"}
        style={{ gap: "1rem" }}
        flexDirection={isExpanded ? "column" : "row"}
        alignItems={"center"}
      >
        <Flex flexDirection={"column"}>
          <Text color="#D4C1B0" fontWeight={"bold"}>
            🔹 $POICE: {score}
          </Text>
        </Flex>
        {isExpanded ? (
          <Flex
            flexDirection={"column"}
            alignItems={"center"}
            style={{ gap: "4rem" }}
          >
            <Flex
              flexDirection={"column"}
              alignItems={"center"}
              style={{ gap: "1rem" }}
              onClick={() => (
                navigator.clipboard.writeText(wallet?.address!), alert("copied")
              )}
            >
              <QRCode value={wallet?.address!}></QRCode>
              <Text color={"#fff"} fontWeight={"bold"} maxWidth={"90%"}>
                {wallet?.address?.substring(0, 6)}...
                {wallet?.address?.substring(wallet?.address?.length - 4)}
                {"  "}(click to copy)
              </Text>
            </Flex>
            <Flex style={{ gap: "4rem" }}>
              <Button
                backgroundColor={"red"}
                onClick={() => (setIsExpanded(false), logout())}
                opacity={0.5}
              >
                logout
              </Button>
              <Button onClick={() => setIsExpanded(false)}>aaight</Button>
            </Flex>
          </Flex>
        ) : (
          <Button
            backgroundColor={"#D4C1B0"}
            color={"#111"}
            p={".25rem 3rem"}
            disabled={!ready}
            onClick={ready && authenticated ? () => setIsExpanded(true) : login}
          >
            <Flex flexDirection={"column"} alignItems={"center"}>
              {ready ? (
                <svg
                  fill="#000000"
                  height="20px"
                  width="20px"
                  version="1.1"
                  id="Layer_1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 458.531 458.531"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <g id="XMLID_830_">
                      <g>
                        <g>
                          <path d="M336.688,343.962L336.688,343.962c-21.972-0.001-39.848-17.876-39.848-39.848v-66.176 c0-21.972,17.876-39.847,39.848-39.847h103.83c0.629,0,1.254,0.019,1.876,0.047v-65.922c0-16.969-13.756-30.725-30.725-30.725 H30.726C13.756,101.49,0,115.246,0,132.215v277.621c0,16.969,13.756,30.726,30.726,30.726h380.943 c16.969,0,30.725-13.756,30.725-30.726v-65.922c-0.622,0.029-1.247,0.048-1.876,0.048H336.688z"></path>
                          <path d="M440.518,219.925h-103.83c-9.948,0-18.013,8.065-18.013,18.013v66.176c0,9.948,8.065,18.013,18.013,18.013h103.83 c9.948,0,18.013-8.064,18.013-18.013v-66.176C458.531,227.989,450.466,219.925,440.518,219.925z M372.466,297.024 c-14.359,0-25.999-11.64-25.999-25.999s11.64-25.999,25.999-25.999c14.359,0,25.999,11.64,25.999,25.999 C398.465,285.384,386.825,297.024,372.466,297.024z"></path>
                          <path d="M358.169,45.209c-6.874-20.806-29.313-32.1-50.118-25.226L151.958,71.552h214.914L358.169,45.209z"></path>
                        </g>
                      </g>
                    </g>
                  </g>
                </svg>
              ) : (
                <Text lineHeight={"20px"}>loading</Text>
              )}
            </Flex>
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
