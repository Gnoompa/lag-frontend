"use client";

import { useEffect, useState } from "react";
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
import useArweave from "@/features/useArweave";
import { usePrivy } from "@privy-io/react-auth";
import useWallet from "@/features/useWallet";
import ImageUploading, { ImageType } from "react-images-uploading";
import { CloseIcon } from "@chakra-ui/icons";
import { last, omit } from "lodash";

export default function Page() {
  const router = useRouter();
  const toast = useToast();

  const [processes, setProcesses] = useState<EProcess[]>([]);
  const [stage, setStage] = useState<EStage>(EStage.initial);

  const { ready, user, login, authenticated, logout } = usePrivy();
  const { signFn } = useWallet();
  const {
    ready: arReady,
    readState,
    auth,
    read,
    write,
    arWallet,
  } = useArweave(user?.wallet?.address);

  const [tokenData, setTokenData] = useState<{
    name?: string;
    about?: string;
    ticker?: string;
    image?: ImageType;
  }>({});

  const [tokenImage, setTokenImage] = useState<ImageType>();

  useEffect(() => {
    ready &&
      user?.wallet?.address &&
      authenticated &&
      signFn &&
      auth(user?.wallet?.address!, signFn);
  }, [ready, user, authenticated, signFn]);

  useEffect(() => {
    tokenImage && setTokenData({ ...tokenData, image: tokenImage });
  }, [tokenImage]);

  const onChangeTokenImage = (tokenImage: ImageType[]) => setTokenImage(tokenImage?.[0]);

  const onCreateButtonClick = () => {
    isTokenDataValid(tokenData)
      ? uploadTokenImage(tokenData.image!).then((metadataId) =>
          writeTokenData({
            endpointId: 1,
            metadata: metadataId,
          })
        )
      : toast({ title: "Fill up 'em fields", status: "warning", isClosable: true });
  };

  const writeTokenData = async (gangData: {}) => {
    if (!user?.wallet?.address || !authenticated) {
      login();

      return;
    }

    if (!arReady) {
      auth(user?.wallet?.address, signFn!);

      return;
    }

    write({ function: "launchGang", gang: gangData })
      .then(() =>
        read({ function: "user", id: arWallet?.address }).then(({ result }) =>
          router.push({
            pathname: `/[vendor]/gang/[id]`,
            // @ts-ignore
            query: { vendor: router.query.vendor || "main", id: last(result.launchedGangs) },
          })
        )
      )
      .catch(() => toast({ title: "Oops, smth went wrong..." }));
    // .finally(() => setProcesses(without(processes, EProcess.uploadingData)));
  };

  const uploadTokenImage = async (image: ImageType) => {
    if (image) {
      setProcesses([...processes, EProcess.uploadingData]);

      const formData = new FormData();

      formData.append("file", image.file!, "image");
      formData.append("data", JSON.stringify(omit(tokenData, ["image"])));

      const res = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });

      const ipfsHash = await res.text();

      // return `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}ipfs/${ipfsHash}`;
      return ipfsHash;
    }
  };

  const isTokenDataValid = (data: typeof tokenData) =>
    !!(data.name && data.ticker && data.about && data.image);

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
            src={tokenImage?.dataURL}
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
          <ImageUploading value={tokenImage ? [tokenImage] : []} onChange={onChangeTokenImage}>
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
          </ImageUploading>
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
          onChange={(event) => setTokenData({ ...tokenData, name: event.target.value })}
          placeholder="Name"
          variant={"filled"}
        ></Input>
        <InputGroup>
          <InputLeftElement pointerEvents="none" color="gray.300" fontSize="1.2em">
            $
          </InputLeftElement>
          <Input
            onChange={(event) => setTokenData({ ...tokenData, ticker: event.target.value })}
            placeholder="Ticker"
            variant={"filled"}
          ></Input>
        </InputGroup>

        <Textarea
          onChange={(event) => setTokenData({ ...tokenData, about: event.target.value })}
          placeholder="About"
          variant={"filled"}
        ></Textarea>
        <Button
          onClick={onCreateButtonClick}
          variant={"accent"}
          w={"10rem"}
          isLoading={processes.includes(EProcess.uploadingData)}
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
