"use client";

import { Box, Button, Flex, Image, ScaleFade, Text } from "@chakra-ui/react";
import { VENDOR_CONFIG } from "@/const";
import useRouter, { ERouterPaths } from "@/features/useRouter";

export default function Page() {
  const { push: routerPush } = useRouter();

  return (
    <Flex
      width={"100%"}
      flexDirection={"column"}
      alignItems={"center"}
      padding={"1rem"}
      p={"30vh 0rem 10vh"}
      height={"100vh"}
      justifyContent={"space-between"}
      suppressHydrationWarning
    >
      <Box className="glitch gl-4">
        <Text
          data-text="LAG"
          fontSize={"5rem"}
          fontWeight={"bold"}
          color={"fg"}
          suppressHydrationWarning
        >
          {VENDOR_CONFIG?.labels?.vendor || "LAG"}
        </Text>
      </Box>

      {VENDOR_CONFIG?.assets?.starter && (
        <ScaleFade in suppressHydrationWarning>
          <Image
            src={VENDOR_CONFIG?.assets?.starter}
            maxW={"80vw"}
            pb={"5rem"}
            suppressHydrationWarning
          ></Image>
        </ScaleFade>
      )}
      <Flex flexDir={"column"} gap={"2rem"} align={"center"} justify={"center"}>
        <ScaleFade
          delay={0.3}
          in
          style={{
            display: "flex",
            alignItems: "center",
            bottom: "15vh",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <Flex pos={"relative"}>
            <Button
              onClick={() => routerPush(ERouterPaths.GANGS)}
              variant={"accent"}
              size={"lg"}
              px={"5rem"}
              zIndex={"99999"}
            >
              LAG IN
            </Button>
            <Text
              fontSize={"3rem"}
              pos={"absolute"}
              top={"-2.5rem"}
              whiteSpace={"nowrap"}
              left={"50%"}
              transform={"translateX(-50%)"}
            >
              💥🎰🤑
            </Text>
          </Flex>
        </ScaleFade>

        {/* <Flex style={{ gap: ".5rem" }} alignItems={"flex-end"} height={"2rem"} opacity={0.5}>
          <Text mb={"1rem"} fontSize={".75rem"}>
            BY
          </Text>
          <Text mb={"1rem"} fontSize={"1rem"}>
            XLAG.TECH
          </Text>
        </Flex> */}
      </Flex>
    </Flex>
  );
}
