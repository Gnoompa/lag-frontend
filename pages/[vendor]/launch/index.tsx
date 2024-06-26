import { useState } from "react";
import {
  Button,
  Container,
  Flex,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { ImageType } from "react-images-uploading";
import { CloseIcon } from "@chakra-ui/icons";
import useGangs from "@/features/useGangs";
import { TGangMetadata } from "lag-types";
import useMedia from "@/features/useMedia";

export default function Page() {
  const router = useRouter();
  const toast = useToast();

  const { ImageInput } = useMedia();
  const { createGang, isCreatingGang, validateGagnMetadata } = useGangs();

  const [gangMetadata, setGangMetadata] = useState<Partial<TGangMetadata>>();
  const [gangImage, setGangImage] = useState<ImageType>();

  const onChangeGangImage = (gangImage: ImageType[]) => setGangImage(gangImage?.[0]);

  const onCreateGangButtonClick = () => {
    gangMetadata && gangImage && validateGagnMetadata(gangMetadata)
      ? createGang(gangMetadata as TGangMetadata, gangImage)
      : toast({ title: "Fill up 'em fields", status: "warning", isClosable: true });
  };

  return (
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
            src={gangImage?.dataURL}
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
        <Flex mt={"-5rem"}>
          <ImageInput value={gangImage ? [gangImage] : []} onChange={onChangeGangImage}>
            {({
              imageList,
              onImageUpload,
              onImageRemoveAll,
              onImageUpdate,
              onImageRemove,
              isDragging,
              dragProps,
            }) => (
              <Flex
                {...dragProps}
                bg={isDragging ? "green" : "black"}
                w={"10rem"}
                h={"10rem"}
                m={"0 auto"}
                justify={"center"}
                align={"center"}
                borderRadius={"full"}
              >
                {imageList[0] && (
                  <IconButton
                    onClick={onImageRemoveAll}
                    bg={"#000000c7"}
                    aria-label="remove image"
                    icon={<CloseIcon color={"red"}></CloseIcon>}
                    pos={"absolute"}
                  ></IconButton>
                )}

                <Image
                  src={imageList?.[0]?.dataURL}
                  fallback={
                    <Button onClick={onImageUpload} variant={"outline"}>
                      Add Image
                    </Button>
                  }
                  w={"9rem"}
                  h={"9rem"}
                  borderRadius={"full"}
                  border={"4px solid black"}
                  bg={"black"}
                ></Image>
              </Flex>
            )}
          </ImageInput>
        </Flex>
      </Container>
      <Flex
        mt={"calc(20vh + 5rem)"}
        flexDir={"column"}
        gap={"2rem"}
        px={"1rem"}
        w={"min(100%, 30rem)"}
        align={"center"}
        justify={"center"}
      >
        <Input
          onChange={(event) => setGangMetadata({ ...gangMetadata, name: event.target.value })}
          placeholder="Name"
          variant={"filled"}
        ></Input>
        <InputGroup>
          <InputLeftElement pointerEvents="none" color="gray.300" fontSize="1.2em">
            $
          </InputLeftElement>
          <Input
            onChange={(event) => setGangMetadata({ ...gangMetadata, ticker: event.target.value })}
            placeholder="Ticker"
            variant={"filled"}
          ></Input>
        </InputGroup>

        <Textarea
          onChange={(event) => setGangMetadata({ ...gangMetadata, about: event.target.value })}
          placeholder="About"
          variant={"filled"}
        ></Textarea>
        <Button
          onClick={onCreateGangButtonClick}
          variant={"accent"}
          w={"10rem"}
          isLoading={isCreatingGang}
        >
          CREATE
        </Button>
      </Flex>
    </Flex>
  );
}

enum EStage {
  initial,
  game,
}

enum EProcess {
  uploadingData,
  saving,
}
