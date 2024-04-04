"use client";

import { Button, Flex, Text } from "rebass";
import { scoreAtom, spoiceAtom } from "../state";
import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import QRCode from "react-qr-code";
import { useAtomValue } from "jotai";

export function Footer() {
  const { ready, authenticated, login, logout, user } = usePrivy();

  const [isExpanded, setIsExpanded] = useState(false);

  const spoice = useAtomValue(spoiceAtom);
  const score = useAtomValue(scoreAtom);

  const wallet = user?.wallet;

  return (
    <Flex
      backgroundColor={"var(--lagblack)"}
      justifyContent={"center"}
      alignItems={"center"}
      height={"4rem"}
      p={".5rem 1rem"}
      style={{ position: "fixed", bottom: 0, width: "100%" }}
    >
      <Text
        color="var(--lagwhite)"
        fontSize={"3rem"}
        fontWeight={"bold"}
        style={{ position: "absolute", top: "-4rem", left: "50%", transform: "translateX(-50%)" }}
      >
        {score}
      </Text>
      {ready ? (
        authenticated ? (
          <Flex
            justifyContent={isExpanded ? "center" : "space-between"}
            width={"100%"}
            style={{ gap: "1rem" }}
            flexDirection={isExpanded ? "column" : "row"}
            alignItems={"center"}
          >
            {isExpanded ? (
              <Flex
                flexDirection={"column"}
                alignItems={"center"}
                style={{ position: "fixed", gap: "4rem", top: 0, backdropFilter: "blur(25px)" }}
                justifyContent={"center"}
                backgroundColor={"#000000c4"}
                width={"100%"}
                height={"100%"}
              >
                <Flex
                  flexDirection={"column"}
                  alignItems={"center"}
                  style={{ gap: "1rem" }}
                  onClick={() => (navigator.clipboard.writeText(wallet?.address!), alert("copied"))}
                >
                  <QRCode value={wallet?.address!} fgColor="#fff" bgColor="transparent"></QRCode>
                  <Flex flexDirection={"column"} style={{ gap: ".5rem" }} alignItems={"center"}>
                    <Text color={"#fff"} fontWeight={"bold"} maxWidth={"90%"} fontSize={"2rem"}>
                      {wallet?.address?.substring(0, 6)}...
                      {wallet?.address?.substring(wallet?.address?.length - 4)}
                    </Text>
                    <Text
                      color={"#fff"}
                      fontWeight={"medium"}
                      maxWidth={"90%"}
                      fontSize={"1rem"}
                      opacity={0.7}
                    >
                      click to copy
                    </Text>
                  </Flex>
                </Flex>
                <Flex style={{ gap: "4rem" }} alignItems={"center"} flexDirection={"column"}>
                  <Button
                    onClick={() => setIsExpanded(false)}
                    backgroundColor={"transparent"}
                    style={{ border: "1px solid #eaeaea" }}
                    p={"3rem 2rem"}
                  >
                    aaight
                  </Button>
                  <svg
                    onClick={() => (setIsExpanded(false), logout())}
                    xmlns="http://www.w3.org/2000/svg"
                    width="40px"
                    height="40px"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <script
                      id="argent-x-extension"
                      data-extension-id="dlcobpjiigpikoobohmabehhmhfoodbb"
                    />
                    <script />
                    <path
                      d="M16 6.07026C18.3912 7.45349 20 10.0389 20 13C20 17.4183 16.4183 21 12 21C7.58172 21 4 17.4183 4 13C4 10.0389 5.60879 7.45349 8 6.07026M12 3V13"
                      stroke="red"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                </Flex>
              </Flex>
            ) : (
              <Flex width={"100%"} justifyContent={"space-around"}>
                <Button
                  backgroundColor={"transparent"}
                  p={".25rem 3rem"}
                  disabled={!ready}
                  // onClick={ready && authenticated ? () => setIsExpanded(true) : login}
                >
                  <Flex flexDirection={"column"} alignItems={"center"}>
                    <Text fontSize={"2rem"}>{ready ? "⚔️" : "⏱"}</Text>
                  </Flex>
                </Button>
                <Button
                  backgroundColor={"transparent"}
                  p={".25rem 3rem"}
                  disabled={!ready}
                  // onClick={ready && authenticated ? () => setIsExpanded(true) : login}
                >
                  <Flex flexDirection={"column"} alignItems={"center"}>
                    <Text fontSize={"2rem"}>{ready ? "🌟" : "⏱"}</Text>
                  </Flex>
                </Button>
                <Button
                  backgroundColor={"transparent"}
                  p={".25rem 3rem"}
                  disabled={!ready}
                  onClick={ready && authenticated ? () => setIsExpanded(true) : login}
                >
                  <Flex flexDirection={"column"} alignItems={"center"}>
                    <Text fontSize={"2rem"}>{ready ? "💰" : "⏱"}</Text>
                  </Flex>
                </Button>
              </Flex>
            )}
          </Flex>
        ) : (
          <Button
            backgroundColor={"transparent"}
            style={{ border: "1px solid #eaeaea" }}
            width={"100%"}
            p={".5rem"}
            onClick={login}
          >
            connect to save score
          </Button>
        )
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect className="spinner_9Mto" x="1" y="1" rx="1" width="10" height="10" fill="#fff" />
          <rect
            className="spinner_9Mto spinner_bb12"
            x="1"
            y="1"
            rx="1"
            width="10"
            height="10"
            fill="#fff"
          />
        </svg>
      )}
    </Flex>
  );
}
