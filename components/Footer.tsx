"use client";

import { Box, Button, Flex, Text } from "rebass";
import { clientPlayerScoreAtom, energyAtom } from "../state";
import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import QRCode from "react-qr-code";
import { useAtomValue } from "jotai";
import { MAX_SCORE_PER_EPOCH } from "@/const";
import DojoIcon from "./icons/Dojo";
import AddIcon from "./icons/Add";
import InventoryIcon from "./icons/Inventory";
import useWallet from "@/features/useWallet";
import { useRouter } from "next/router";

export function Footer() {
  const router = useRouter();

  const { ready, authenticated, login, logout, user, linkWallet, linkEmail, unlinkWallet } =
    usePrivy();
  const { wallet, linkedWallets } = useWallet();

  const [isExpanded, setIsExpanded] = useState(false);

  const clientPlayerScore = useAtomValue(clientPlayerScoreAtom);

  const energy = useAtomValue(energyAtom);

  return (
    <Flex
      justifyContent={"center"}
      alignItems={"center"}
      height={"5rem"}
      width={"min(25rem, 90%)"}
      // maxWidth={"max(90%)"}
      p={".5rem 1rem"}
      style={{
        position: "fixed",
        bottom: "1rem",
        // width: "100%",
        borderRadius: "20px",
        border: "1px solid #444",
        background: "linear-gradient(325deg, rgb(0 0 0 / 30%) 50%, rgb(83 255 216 / 46%) 200%)",
      }}
    >
      <svg
        style={{
          pointerEvents: "none",
          position: "absolute",
          width: "100%",
          top: "-16px",
        }}
        width="396"
        height="42"
        viewBox="0 0 396 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter="url(#filter0_b_389_687)">
          <path
            d="M28 6C12.536 6 0 18.536 0 34V42C0 26.536 12.536 14 28 14H368C383.464 14 396 26.536 396 42V34C396 18.536 383.464 6 368 6H28Z"
            fill="url(#paint0_linear_389_687)"
          />
        </g>
        <path
          d="M200.095 10.9253L202.203 11.48L193.546 22.7638L195.305 14.5572L195.421 14.0164L194.938 13.7459L192.874 12.5878L196.005 0.75H202.929L199.582 9.94341L199.3 10.7161L200.095 10.9253Z"
          fill="#111111"
          stroke="#6EFEC2"
          stroke-width="1.5"
        />
        <defs>
          <filter
            id="filter0_b_389_687"
            x="-16.6"
            y="-10.6"
            width="429.2"
            height="69.2"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feGaussianBlur in="BackgroundImageFix" stdDeviation="8.3" />
            <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_389_687" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_backgroundBlur_389_687"
              result="shape"
            />
          </filter>
          <linearGradient
            id="paint0_linear_389_687"
            x1="0"
            y1="24"
            x2="396"
            y2="24"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset={energy / MAX_SCORE_PER_EPOCH} stop-color="#6EFEC2" />
            <stop offset="0" stop-color="#429874" stop-opacity="0.6" />
          </linearGradient>
        </defs>
      </svg>

      <Text
        fontWeight={700}
        fontSize={"2rem"}
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: "-4rem",
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(#53FFD8, #02B1AA)",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {clientPlayerScore}
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
                <Flex style={{ gap: "1rem" }} alignItems={"center"} flexDirection={"column"}>
                  <Button
                    onClick={() => setIsExpanded(false)}
                    backgroundColor={"transparent"}
                    style={{ border: "1px solid #eaeaea" }}
                    p={"3rem 2rem"}
                  >
                    aaight
                  </Button>
                  <Button
                    onClick={() =>
                      user?.linkedAccounts &&
                      Promise.all(
                        user?.linkedAccounts.map(
                          (account) =>
                            account.type == "wallet" &&
                            account.connectorType !== "embedded" &&
                            unlinkWallet(account.address)
                        )
                      ).finally(linkWallet)
                    }
                    backgroundColor={"transparent"}
                    style={{ border: "1px solid #eaeaea" }}
                    p={"3rem 2rem"}
                  >
                    link
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
              <Box
                width={"100%"}
                display={"grid"}
                style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
              >
                <Button
                  bg={"transparent"}
                  onClick={() => router.push("/dojo")}
                  disabled={!ready}
                >
                  <Flex flexDirection={"column"} alignItems={"center"} style={{ gap: ".25rem" }}>
                    <DojoIcon />
                    <Text
                      style={{
                        fontWeight: 500,
                        background: "linear-gradient(#53FFD8, #02B1AA)",
                        fontSize: ".75rem",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      DOJO
                    </Text>
                  </Flex>
                </Button>
                {/* <hr color="#fff" style={{opacity: .3}} /> */}
                <Button bg={"transparent"}>
                  <Flex flexDirection={"column"} alignItems={"center"} style={{ gap: ".25rem" }}>
                    <AddIcon />
                    <Text
                      style={{
                        fontWeight: 500,
                        background: "linear-gradient(#53FFD8, #02B1AA)",
                        backgroundClip: "text",
                        fontSize: ".75rem",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      INVITE
                    </Text>
                  </Flex>
                </Button>
                <Button
                  bg={"transparent"}
                  disabled={!ready}
                  onClick={() => router.push("/linking")}
                >
                  <Flex flexDirection={"column"} alignItems={"center"} style={{ gap: ".25rem" }}>
                    <InventoryIcon />
                    <Text
                      style={{
                        fontWeight: 500,
                        background: "linear-gradient(#53FFD8, #02B1AA)",
                        backgroundClip: "text",
                        fontSize: ".75rem",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      ARMORY
                    </Text>
                  </Flex>
                </Button>
                {/* <Button
                  backgroundColor={"transparent"}
                  p={".25rem 3rem"}
                  disabled={!ready}
                  onClick={ready && authenticated ? () => setIsExpanded(true) : login}
                >
                  <Flex flexDirection={"column"} alignItems={"center"}>
                    <Text fontSize={"2rem"}>{ready ? "💰" : "⏱"}</Text>
                  </Flex>
                </Button> */}
              </Box>
            )}
          </Flex>
        ) : (
          <Button
            backgroundColor={"transparent"}
            width={"100%"}
            onClick={login}
            flexDirection={"column"}
            alignItems={"center"}
          >
            <Text
              backgroundColor={"transparent"}
              width={"100%"}
              className="accentText"
              fontSize={"1.75rem"}
              fontWeight={600}
              lineHeight={"1.75rem"}
            >
              CONNECT
            </Text>
            <Text opacity={0.5} fontSize={"0.75rem"}>
              TO SAVE PROGRESS
            </Text>
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
