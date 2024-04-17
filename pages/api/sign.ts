import type { NextApiRequest, NextApiResponse } from "next";
import {
  createPublicClient,
  createWalletClient,
  encodePacked,
  hexToBytes,
  http,
  keccak256,
  parseAbi, parseEther, recoverMessageAddress
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chunk, flatten, min } from "lodash";
import { base } from "viem/chains";

export const CLIENT_SIGNATURE_MESSAGE = "Sign to check $JACKIE eligibility";

const PRIMARY_DNA_ELIGIBLE_AMOUNT = 1000;
const PREMIUM_DNA_ELIGIBLE_AMOUNT = 10000;
const MAX_MULTIPLIER_ELIGIBLE_AMOUNT = 10;

export enum Errors {
  InvalidSignature = "Invalid signature",
  NoPrimaryDNA = "No primary DNA found",
  InvalidPayload = "Couldn't process the request",
}

export type TEligibility = {
  hasPrimaryDna: 0 | 1;
  hasPremiumDna: 0 | 1;
  multiplier: number;
  signature: string;
  deadline: number;
  eligibilityBitmap: number;
  eligibileAmount: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const ALCHEMY_API_LEY = "akP0S27ZVCFL63nhEKqlcZ2Rcx0wKRLT";
  // const SK =
  //   "0xe7733d4d88edd973af4582e2e5f948f90ff05739ec12f4ad4400944c5d502d52";
  const SK =
    "0x50dbee7122927794ea24c8e85a2fdf13ff590cffb95eeab1bd1ab769063b9044";
  const NFT = "0x93fc9cbcfd9482a2d8cfbadac80a082256e10bdd";
  const SIG_DEADLINE = 3600;

  const NFT_TOKEN_ID = BigInt(1);

  const walletClient = createWalletClient({
    account: privateKeyToAccount(SK),
    transport: http("https://base.llamarpc.com"),
  });

  const publicClient = createPublicClient({
    chain: base,
    transport: http("https://base-rpc.publicnode.com"),
  });

  try {
    const body = JSON.parse(req.body);
    const address = body.address;
    // const address = "0x69F77b2471e198dfae24164C9C97640695836f7D";
    const userSignedMessage = body.signedMessage;

    if (
      address !=
      (await recoverMessageAddress({
        message: CLIENT_SIGNATURE_MESSAGE,
        signature: userSignedMessage,
      }))
    ) {
      return res.status(500).json({ error: Errors.InvalidSignature });
    }

    const multiplierNft = publicClient.readContract({
      address: NFT,
      abi: parseAbi([
        "function balanceOf(address owner, uint256 id) view returns (uint256)",
      ]),
      functionName: "balanceOf",
      args: [address, NFT_TOKEN_ID],
    });

    // @ts-ignore
    const dnas = await fetch(
      `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_LEY}/getNFTsForOwner?owner=${address}&contractAddresses[]=0x932261f9Fc8DA46C4a22e31B45c4De60623848bF&withMetadata=true&pageSize=100`,
      { method: "GET", headers: { accept: "application/json" } }
    ).then((response) => response.json());

    let allDnas = dnas.ownedNfts;

    if (+dnas.totalCount > 100) {
      allDnas = [
        ...allDnas,
        ...flatten(
          await Promise.all(
            chunk(Array(+dnas.totalCount - 100), 100).map((_, pageKey) =>
              fetch(
                `https://eth-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_LEY}/getNFTsForOwner?owner=${address}&contractAddresses[]=0x932261f9Fc8DA46C4a22e31B45c4De60623848bF&withMetadata=true&pageSize=100&pageKey=${pageKey}`,
                { method: "GET", headers: { accept: "application/json" } }
              ).then((response) => response.json())
            )
          )
        ).map(({ ownedNfts }) => ownedNfts),
      ];
    }


    const primaryDna = allDnas.filter(
      // @ts-ignore
      (dna) =>
        dna.raw.metadata.attributes.filter(
          // @ts-ignore
          (attr) => attr.trait_type == "Primary" && attr.value == "Yes"
        )[0]
    );

    if (!primaryDna.length) {
      return res.status(500).json({ error: Errors.NoPrimaryDNA });
    }


    const premiumDna = allDnas.filter(
      // @ts-ignore
      (dna) =>
        dna.raw.metadata.attributes.filter(
          // @ts-ignore
          (attr) =>
            attr.trait_type == "Premium" &&
            ["Non-Lifetime", "Lifetime"].includes(attr.value)
        )[0]
    );

    const multiplier = +(await multiplierNft).toString() || 0;

    const eligibilityBitmap = (premiumDna.length ? 1 : 0) | (1 << Number(multiplier));
    const eligibileAmount =
      (PRIMARY_DNA_ELIGIBLE_AMOUNT +
        (premiumDna.length && PREMIUM_DNA_ELIGIBLE_AMOUNT)) *
      (min([multiplier + 1, MAX_MULTIPLIER_ELIGIBLE_AMOUNT]) || 1);

    const deadline = ~~(Date.now() / 1000 + SIG_DEADLINE);
    const msgToSign = encodePacked(
      ["address", "uint", "uint", "uint"],
      [
        address,
        parseEther(eligibileAmount.toString()),
        BigInt(eligibilityBitmap),
        BigInt(deadline),
      ]
    );

    const signature = await walletClient.signMessage({
      message: { raw: hexToBytes(keccak256(msgToSign)) },
    });

    res.status(200).json({
      hasPrimaryDna: primaryDna.length && 1,
      hasPremiumDna: premiumDna.length && 1,
      multiplier,
      signature,
      deadline,
      eligibilityBitmap,
      eligibileAmount,
    } as TEligibility);
  } catch (e) {
    res.status(500).json({ error: Errors.InvalidPayload });
  }
}
