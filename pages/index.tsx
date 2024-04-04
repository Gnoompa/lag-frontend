"use client";

import { Button, Flex, Heading, Text } from "rebass/styled-components";
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai/react";
import { currentEpochAtom } from "../state";
import { useRouter } from "next/navigation";

export default function Page() {
  const currentEpoch = useAtomValue(currentEpochAtom);

  const router = useRouter();

  const [isInited, setIsInited] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsInited(true), 100);
  }, []);

  return (
    <Flex
      width={"100%"}
      flexDirection={"column"}
      alignItems={"center"}
      backgroundColor={"var(--lagblack)"}
      height={"100vh"}
    >
      {/* <img
        src={"/sand.png"}
        style={{
          position: "fixed",
          bottom: "-1rem",
          width: "100%",
          transform: isInited ? "translateY(0)" : "translateY(100vh)",
          transition: ".5s",
        }}
      ></img> */}
      {/* <img
        src={"austin.png"}
        style={{
          position: "fixed",
          bottom: "10rem",
          transform:
            "rotateZ(30deg) " +
            (isInited ? " translateX(0)" : " translateX(-100vw)"),
          left: "-3rem",
          width: "10rem",
          transition: ".5s",
        }}
      ></img> */}
      <img
        src={"lag.png"}
        style={{
          position: "fixed",
          bottom: "50%",
          transform: isInited
            ? "rotateZ(-60deg) translate(0, 50%)"
            : "rotateZ(0deg) translate(100vw, 50%)",
          right: "0",
          height: "33vh",
          transition: ".5s",
        }}
      ></img>
      <Flex
        flexDirection={"column"}
        alignItems={"center"}
        style={{ position: "relative" }}
        justifyContent={"space-between"}
        height={"100vh"}
      >
        <Flex flexDirection={"column"} alignItems={"center"}>
          <Heading fontSize={"7rem"} color={"#eaeaea"} fontWeight={"bold"} mt={"5rem"}>
            LAG
          </Heading>
          {/* <Text opacity={0.7} color={"#111"} fontSize={"1.5rem"}>
            epoch #{currentEpoch}
          </Text> */}
        </Flex>
        <Button
          onClick={() => router.push("/game")}
          backgroundColor={"transparent"}
          style={{ border: "1px solid #eaeaea" }}
          p={"3rem 2rem"}
          mb={"5rem"}
        >
          <Text fontSize={"2rem"} fontWeight={900} color={"#fff"}>
            DEGENTER
          </Text>
        </Button>
      </Flex>
      <Flex style={{gap: ".5rem"}} alignItems={"flex-end"}>
        <Text mb={"1rem"} fontSize={".75rem"}>BY</Text>
        <Text mb={"1rem"} fontSize={"1.25rem"}>DOUBLETAP.WTF</Text>
      </Flex>
      
    </Flex>
  );
}
