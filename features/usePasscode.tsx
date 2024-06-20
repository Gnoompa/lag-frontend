import { Flex, PinInput, PinInputField, SlideFade, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export default function usePasscode(passcode: string) {
  const passcodeId = `__passcode_${passcode}`;

  const [enteredPasscode, setEnteredPasscode] = useState<string>();
  const [hasEnteredPasscode, setHasEnteredPasscode] = useState<boolean>();

  const onPasscodeInput = (value: string) => {
    setEnteredPasscode(value?.toLocaleLowerCase());
  };

  useEffect(() => {
    setHasEnteredPasscode(localStorage.getItem(passcodeId) === passcode);
  }, [passcode]);

  useEffect(() => {
    enteredPasscode &&
      enteredPasscode === passcode &&
      (setHasEnteredPasscode(true), localStorage.setItem(passcodeId, passcode));
  }, [enteredPasscode]);

  const PasscodeModal = () => (
    <SlideFade
      in
      style={{
        position: "fixed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
      }}
    >
      <Flex
        gap={".5rem"}
        w={"100%"}
        height={"100%"}
        bg={"bg"}
        flexDir={"column"}
        align={"center"}
        justify={"center"}
      >
        <Flex gap={"1rem"} align={"center"} justify={"center"}>
          <PinInput
            type="alphanumeric"
            size={"lg"}
            autoFocus
            colorScheme="whiteAlpha"
            isInvalid={enteredPasscode ? enteredPasscode !== passcode : false}
            onComplete={onPasscodeInput}
          >
            <PinInputField />
            <PinInputField />
            <PinInputField />
            <PinInputField />
            <PinInputField />
          </PinInput>
        </Flex>
        <Text opacity={0.8} fontWeight={"400"}>
          code phrase
        </Text>
      </Flex>
    </SlideFade>
  );

  return {
    hasEnteredPasscode,
    PasscodeModal,
  };
}
