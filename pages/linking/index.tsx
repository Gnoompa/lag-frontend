import useWallet from "@/features/useWallet";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { Box, Button, Flex, Image, Text } from "rebass";
import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { Carousel } from "react-responsive-carousel";
import PrimaryButton from "@/components/PrimaryButton";
import useArweave from "@/features/useArweave";
import { useRouter } from "next/router";
import { useAtom } from "jotai";
import { persistedPlayerStateAtom } from "@/state";

export enum PROCESSES {
  SAVING_PFP,
}

export default function Linking() {
  const [processes, setProcesses] = useState<PROCESSES[]>([]);

  const router = useRouter();

  const [persistedPlayerState, setPersistedPlayerState] = useAtom(persistedPlayerStateAtom);

  const { user, signMessage, ready, authenticated, linkWallet, login } = usePrivy();
  const { wallet } = useWallet();
  const { lastLinkedExternalWallet, linkedWallets } = useWallet();
  const ar = useArweave(user?.wallet?.address);

  const [nfts, setNfts] = useState<{}[]>();
  const [pfp, setPfp] = useState<{ imageUrl: string; metadataUrl: string; nftId: string }>();

  useEffect(() => {
    authenticated &&
      ready &&
      user?.wallet?.address &&
      wallet &&
      ar.auth(wallet?.address, signMessage);
  }, [authenticated, ready, user, wallet, signMessage]);

  useEffect(() => {
    lastLinkedExternalWallet && fetchNfts();
  }, [lastLinkedExternalWallet]);

  const fetchNfts = async () => {
    const ids = await fetchCollectionItemIds();
    const nfts = await fetchNftsByCollectionIds(ids);

    setNfts(nfts.items || []);
  };

  const fetchCollectionItemIds = () =>
    fetch("https://api.rarible.org/v0.1/ownerships/search", {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "X-API-KEY": "2996a7f3-963b-41bd-86ec-dc86bf780c1d",
      },
      // body: `{\"size\":20,\"filter\":{\"blockchains\":[\"MANTLE\"],\"sort\":\"LATEST\",\"collections\":[\"MANTLE:0x1d2b17c6e5d0d617f69c2c017dc19eb5fa85cb3c\",\"MANTLE:0x7e762d9638b9aa750a0409b36ea55522aa00ef73\",\"MANTLE:0xcf32863dddd992d86103eb373254a05731c7412b\",\"MANTLE:0x1f1988091f8cc8fd4c3a27813960524d4b92e699\",\"MANTLE:0xc0c0be8bc1eb075f80f8356f76cf2867490fcf51\",\"MANTLE:0xa1ae08e846dd6fdc15d7815ec258828a215c7eab\",\"MANTLE:0x6dd13e48351b90186d2f0e5055b4c3629d9de5a1\",\"MANTLE:0x03ddc4b60d6bbf399a8397d73462060fdfb83476\",\"MANTLE:0x2c431137325301a5b807923608a5dcfa01326ac0\",\"MANTLE:0x7c0792ec5ed5362c4efac4317689accd98b129bb\",\"MANTLE:0x8088069f7aad96b2a3c42a4f2b044d5321e9872b\",\"MANTLE:0x73855b302ea512b0360fcb05b48a89ed0f9dea3c\",\"MANTLE:0x8bb3e1b5ed708afa91ecf00bd7ab76c25f3a2ec9\",\"MANTLE:0xa9fb1952074c2d8fee7ae529d62b52a9927540e5\",\"MANTLE:0xcf34283f6aebe73bc85ec6231075171023211545\",\"MANTLE:0x62e97cb1d4a41d55ce2502bdc28142b0c551cecf\",\"MANTLE:0xf4c9afb38fc7cf4af1499af2786b1c5871e4e20a\",\"MANTLE:0xb8181e66d17b0e550a8a7c7679e14f5dda34fb57\",\"MANTLE:0x450b14fc5c420dca1182180a400a959abc87f0c4\",\"MANTLE:0x2e6e39b6c353a509353ec70e58e12547a6e3d1a6\",\"MANTLE:0xafc7649b722adb34463576a15eeb08bc0d692b4a\",\"MANTLE:0x47dac272281fdb2931f3ddc0106f7faa8ffbf956\",\"MANTLE:0xad1bc505adf5f5571915859d157117d8d363e8f9\",\"MANTLE:0x842397382ea9af287e552a7f68da1da6b3db6944\",\"MANTLE:0xcb0bb5d835a47584fda53f57bb4193b28d2738db\",\"MANTLE:0xdd03a7d748e2cc6e6344c4f1aab26a5df9edb393\",\"MANTLE:0xe5325804d68033edf65a86403b2592a99e1f06de\",\"MANTLE:0x98dd8b97d8fc2a585bd2570af13724b6f144e956\",\"MANTLE:0x5025fa31f72950295875a209e5e05f29b68b8457\",\"MANTLE:0xd4feff615c0e90f06340be95d30e1f397779a184\",\"MANTLE:0x48a271f014c689b204fe9f0bb5002fb3eb9c5a02\",\"MANTLE:0xe92cf32a5c92eb6142a847a2401e4ba8bc6bae6f\",\"MANTLE:0x2c4bd4e25d83285f417e26a44069f41d1a8ad0e7\",\"MANTLE:0xbed36ee9280867edbd5aae902da453fcca653bca\",\"MANTLE:0x2aa7e08eb0ba427f2b8f8e6e4c28b667cd6b6151\",\"MANTLE:0x7cf4ac414c94e03ecb2a7d6ea8f79087453caef0\",\"MANTLE:0x0d380362762b0cf375227037f2217f59a4ec4b9e\",\"MANTLE:0xda271d553b09f3e4642609f8846b8d1dcedbef5b\",\"MANTLE:0x8b9401f93fee47711cbf11adc3df9ed18e377b34\",\"MANTLE:0x73639d5c8702798008c09bf48550f32dec46336c\",\"MANTLE:0x44d1fb11582bf928b801a9316d453c39d52e9332\",\"MANTLE:0xc86f35909af95bd0eadfbd2fcac9c4e0a82944b1\",\"MANTLE:0x949f2ffef0ede8a47105eb426556cf82b64aaea4\",\"MANTLE:0x91206f52d03a8807ec503e5c9b6a6d6f8fa3a55c\",\"MANTLE:0x150d1b30e10359f9ff1a0257b6eb19fa019fa76c\",\"MANTLE: 0x206249bf17e57cebecb80f4d4b93de8b76da93c4\",\"MANTLE:0xd498f3aee8feb266a1d93023e944e551d916ae92\",\"MANTLE:0xd034ce78efe77727266fd74e04feb8254bbc7516\",\"MANTLE:0xc07bd0c66be7cf91afcdcd3595e8999c5a9bf570\",\"MANTLE:0xb2b32b356a61505b4c4c556f49087c405fdd8410\",\"MANTLE:0x21b276de139ce8c75a7b4f750328dbf356195b49\",\"MANTLE:0xe661ef1bea9c4502909cdd1ba8eb3b620dc44265\",\"MANTLE:0x4cc6aa5b8b528fea4e64df81260ebc2308251e74\",\"MANTLE:0x859fcadd96a054678fa3c50d46123a324a15a0d6\",\"MANTLE:0x99fd2031ee4393ae66117e25382d104da2e9e062\",\"MANTLE:0x1c5e726872de2186c1775c63e653a3184300fb22\",\"MANTLE:0x8ca3db651462c9d28b90e56a275e522682ef7543\",\"MANTLE:0xa7236ac4ae735bcad76e3d56d07d929a9be865f6\",\"MANTLE:0xe85b61e16b6be6c74bffa904ae403dce24355643\",\"MANTLE:0x712f0b34ddc7a36b486404497aaba697d9597b47\",\"MANTLE:0x7214f5fc6af9249e424f65ceb371b463e3657c0e\",\"MANTLE:0x33ae5f7eed4f5c498869bb671bb20ad5a2ffed25\",\"MANTLE:0x78a4ab4feab364864de60e911723d063de2e128e\"],\"currency\":\"MANTLE:0x0000000000000000000000000000000000000000\",\"owner\":\"${
      //   "0xfb45c343702832e45df6996096de7d79ebc53578" || lastLinkedExternalWallet?.address
      // }\",\"verifiedOnly\":false}}`,
      body: `{\"size\":20,\"filter\":{\"blockchains\":[\"MANTLE\"],\"sort\":\"LATEST\",\"collections\":[\"MANTLE:0x1d2b17c6e5d0d617f69c2c017dc19eb5fa85cb3c\",\"MANTLE:0x7e762d9638b9aa750a0409b36ea55522aa00ef73\",\"MANTLE:0xcf32863dddd992d86103eb373254a05731c7412b\",\"MANTLE:0x1f1988091f8cc8fd4c3a27813960524d4b92e699\",\"MANTLE:0xc0c0be8bc1eb075f80f8356f76cf2867490fcf51\",\"MANTLE:0xa1ae08e846dd6fdc15d7815ec258828a215c7eab\",\"MANTLE:0x6dd13e48351b90186d2f0e5055b4c3629d9de5a1\",\"MANTLE:0x03ddc4b60d6bbf399a8397d73462060fdfb83476\",\"MANTLE:0x2c431137325301a5b807923608a5dcfa01326ac0\",\"MANTLE:0x7c0792ec5ed5362c4efac4317689accd98b129bb\",\"MANTLE:0x8088069f7aad96b2a3c42a4f2b044d5321e9872b\",\"MANTLE:0x73855b302ea512b0360fcb05b48a89ed0f9dea3c\",\"MANTLE:0x8bb3e1b5ed708afa91ecf00bd7ab76c25f3a2ec9\",\"MANTLE:0xa9fb1952074c2d8fee7ae529d62b52a9927540e5\",\"MANTLE:0xcf34283f6aebe73bc85ec6231075171023211545\",\"MANTLE:0x62e97cb1d4a41d55ce2502bdc28142b0c551cecf\",\"MANTLE:0xf4c9afb38fc7cf4af1499af2786b1c5871e4e20a\",\"MANTLE:0xb8181e66d17b0e550a8a7c7679e14f5dda34fb57\",\"MANTLE:0x450b14fc5c420dca1182180a400a959abc87f0c4\",\"MANTLE:0x2e6e39b6c353a509353ec70e58e12547a6e3d1a6\",\"MANTLE:0xafc7649b722adb34463576a15eeb08bc0d692b4a\",\"MANTLE:0x47dac272281fdb2931f3ddc0106f7faa8ffbf956\",\"MANTLE:0xad1bc505adf5f5571915859d157117d8d363e8f9\",\"MANTLE:0x842397382ea9af287e552a7f68da1da6b3db6944\",\"MANTLE:0xcb0bb5d835a47584fda53f57bb4193b28d2738db\",\"MANTLE:0xdd03a7d748e2cc6e6344c4f1aab26a5df9edb393\",\"MANTLE:0xe5325804d68033edf65a86403b2592a99e1f06de\",\"MANTLE:0x98dd8b97d8fc2a585bd2570af13724b6f144e956\",\"MANTLE:0x5025fa31f72950295875a209e5e05f29b68b8457\",\"MANTLE:0xd4feff615c0e90f06340be95d30e1f397779a184\",\"MANTLE:0x48a271f014c689b204fe9f0bb5002fb3eb9c5a02\",\"MANTLE:0xe92cf32a5c92eb6142a847a2401e4ba8bc6bae6f\",\"MANTLE:0x2c4bd4e25d83285f417e26a44069f41d1a8ad0e7\",\"MANTLE:0xbed36ee9280867edbd5aae902da453fcca653bca\",\"MANTLE:0x2aa7e08eb0ba427f2b8f8e6e4c28b667cd6b6151\",\"MANTLE:0x7cf4ac414c94e03ecb2a7d6ea8f79087453caef0\",\"MANTLE:0x0d380362762b0cf375227037f2217f59a4ec4b9e\",\"MANTLE:0xda271d553b09f3e4642609f8846b8d1dcedbef5b\",\"MANTLE:0x8b9401f93fee47711cbf11adc3df9ed18e377b34\",\"MANTLE:0x73639d5c8702798008c09bf48550f32dec46336c\",\"MANTLE:0x44d1fb11582bf928b801a9316d453c39d52e9332\",\"MANTLE:0xc86f35909af95bd0eadfbd2fcac9c4e0a82944b1\",\"MANTLE:0x949f2ffef0ede8a47105eb426556cf82b64aaea4\",\"MANTLE:0x91206f52d03a8807ec503e5c9b6a6d6f8fa3a55c\",\"MANTLE:0x150d1b30e10359f9ff1a0257b6eb19fa019fa76c\",\"MANTLE: 0x206249bf17e57cebecb80f4d4b93de8b76da93c4\",\"MANTLE:0xd498f3aee8feb266a1d93023e944e551d916ae92\",\"MANTLE:0xd034ce78efe77727266fd74e04feb8254bbc7516\",\"MANTLE:0xc07bd0c66be7cf91afcdcd3595e8999c5a9bf570\",\"MANTLE:0xb2b32b356a61505b4c4c556f49087c405fdd8410\",\"MANTLE:0x21b276de139ce8c75a7b4f750328dbf356195b49\",\"MANTLE:0xe661ef1bea9c4502909cdd1ba8eb3b620dc44265\",\"MANTLE:0x4cc6aa5b8b528fea4e64df81260ebc2308251e74\",\"MANTLE:0x859fcadd96a054678fa3c50d46123a324a15a0d6\",\"MANTLE:0x99fd2031ee4393ae66117e25382d104da2e9e062\",\"MANTLE:0x1c5e726872de2186c1775c63e653a3184300fb22\",\"MANTLE:0x8ca3db651462c9d28b90e56a275e522682ef7543\",\"MANTLE:0xa7236ac4ae735bcad76e3d56d07d929a9be865f6\",\"MANTLE:0xe85b61e16b6be6c74bffa904ae403dce24355643\",\"MANTLE:0x712f0b34ddc7a36b486404497aaba697d9597b47\",\"MANTLE:0x7214f5fc6af9249e424f65ceb371b463e3657c0e\",\"MANTLE:0x33ae5f7eed4f5c498869bb671bb20ad5a2ffed25\",\"MANTLE:0x78a4ab4feab364864de60e911723d063de2e128e\"],\"currency\":\"MANTLE:0x0000000000000000000000000000000000000000\",\"owners\":[\"${
        // "ETHEREUM:0xA9A088600Fb0D0dD392445cc6328f07D352f59b0" ||
        `ETHEREUM:${lastLinkedExternalWallet?.address}`
      }\"],\"verifiedOnly\":false}}`,
      method: "POST",
    })
      .then((res) => res.json())
      .then(({ ownerships }) =>
        ownerships.map(
          ({ id }: { id: string }) => "MANTLE:" + id.substring(7).split(":").splice(0, 2).join(":")
        )
      );

  const fetchNftsByCollectionIds = (ids: string[]) =>
    fetch("https://api.rarible.org/v0.1/items/byIds", {
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9,ml;q=0.8,ja;q=0.7,ru;q=0.6,tr;q=0.5",
        "cache-control": "no-cache",
        "content-type": "application/json",
        pragma: "no-cache",
        "sec-ch-ua": '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "x-api-key": "555bb639-8325-4840-91c0-c25a9c38f366",
      },
      referrer: "https://mintle.app/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: JSON.stringify({ ids }),
      method: "POST",
      mode: "cors",
      credentials: "omit",
    }).then((res) => res.json());

  const onCarouselGuardianNftChange = (carouselSlideIndex: number) =>
    setPfp({
      // @ts-ignore
      imageUrl: nfts![carouselSlideIndex].meta.content[0].url,
      // @ts-ignore
      metadataUrl: nfts![carouselSlideIndex].meta.originalMetaUri,
      // @ts-ignore
      nftId: nfts![carouselSlideIndex].id,
    });

  const onChooseGuardianButtonClick = () => {
    // setProcesses([...processes, PROCESSES.SAVING_PFP]);

    const playerPfp = pfp || {
      // @ts-ignore
      imageUrl: nfts![0].meta.content[0].url,
      // @ts-ignore
      metadataUrl: nfts![0].meta.originalMetaUri,
      // @ts-ignore
      nftId: nfts![0].id,
    };

    ar.write({
      function: "pfp",
      pfp: playerPfp,
    })
      .catch((e) => (alert("Something went wrong"), console.error(e)))
      .then(
        () => (
          setPersistedPlayerState({ ...persistedPlayerState, pfp: playerPfp }), router.push("/game")
        )
      );
  };

  return (
    <Flex flexDirection={"column"} style={{ gap: "2rem" }} alignItems={"center"} p={"2rem"}>
      <Text className="accentText" fontWeight={"600"} fontSize={"2rem"} textAlign={"center"}>
        CHOOSE YOUR GUARDIAN
      </Text>
      {ready && authenticated && !lastLinkedExternalWallet && (
        <Button onClick={linkWallet} bg={"transparent"}>
          <PrimaryButton>LINK WALLET</PrimaryButton>
        </Button>
      )}
      {ready && !authenticated && (
        <Button onClick={login} bg={"transparent"}>
          <PrimaryButton>LOGIN</PrimaryButton>
        </Button>
      )}
      {lastLinkedExternalWallet?.address && (
        <Flex flexDirection={"column"} style={{ gap: "1rem" }} alignItems={"center"}>
          <Button onClick={linkWallet} bg={"transparent"}>
            <PrimaryButton width="20rem">RECONNECT</PrimaryButton>
          </Button>
          <Text className="accentText" opacity={0.7}>
            CONNECTED WALLET:{" "}
            {`${lastLinkedExternalWallet?.address.substring(
              0,
              6
            )}...${lastLinkedExternalWallet?.address.substring(6, 10)}`}
          </Text>
        </Flex>
      )}
      {nfts === undefined ? (
        <Text>loading</Text>
      ) : nfts?.length ? (
        <Flex flexDirection={"column"} style={{ gap: "1rem" }} alignItems={"center"}>
          <Box
            style={{ boxShadow: "0 0 50px #00ffd43d", borderRadius: "10px", overflow: "hidden" }}
          >
            <Carousel
              onChange={onCarouselGuardianNftChange}
              emulateTouch={true}
              width={"20rem"}
              showArrows={false}
              showStatus={false}
              showIndicators={false}
              showThumbs={false}
            >
              {nfts?.map((nft, key) => (
                <Flex flexDirection={"column"} key={key}>
                  {/* <Text>{nft.meta.name}</Text> */}
                  <Image
                    src={
                      // @ts-ignore
                      nft.meta.content[0].url
                    }
                  ></Image>
                </Flex>
              ))}
            </Carousel>
          </Box>
          <Button onClick={onChooseGuardianButtonClick} bg={"transparent"}>
            <PrimaryButton width="20rem">CHOOSE</PrimaryButton>
          </Button>
        </Flex>
      ) : (
        <Text className="accentText" fontWeight={"600"} fontSize={"2rem"}>
          No NFTs found
        </Text>
      )}
    </Flex>
  );
}
