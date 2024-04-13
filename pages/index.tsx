"use client";

import { Box, Button, Flex, Text } from "rebass/styled-components";
import { useEffect, useState } from "react";
import { useAtomValue } from "jotai/react";
import { currentEpochAtom } from "../state";
import { useRouter } from "next/navigation";
import Title from "@/components/Title";
import PrimaryButton from "@/components/PrimaryButton";

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
      // backgroundColor={"var(--lagblack)"}
      padding={"1rem"}
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
      {/* <img
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
      ></img> */}
      <Flex
        flexDirection={"column"}
        alignItems={"center"}
        style={{
          position: "relative",
          borderRadius: "10px",
          border: "1px solid #1c3630",
          background: "linear-gradient(325deg, rgb(0 0 0 / 30%) 50%, rgb(83 255 216 / 46%) 200%)",
        }}
        justifyContent={"space-around"}
        height={"100%"}
        width={"100%"}
        p={"0 2rem"}
      >
        <Flex flex={0.6} alignItems={"center"}>
          <Title />
        </Flex>

        <Button
          onClick={() => router.push("/game")}
          bg={"transparent"}
          className="primaryButton"
          flex={0.2}
        >
          <PrimaryButton>ENTER</PrimaryButton>
        </Button>
        <Flex style={{ gap: ".5rem" }} alignItems={"flex-end"} opacity={0.5} flex={0.1}>
          <Text fontSize={[".5rem", ".75rem"]}>BY</Text>
          <Text fontSize={["1rem", "1.25rem"]}>DOUBLETAP.WTF</Text>
        </Flex>
      </Flex>
    </Flex>
  );
}
