import type { NextApiRequest, NextApiResponse } from "next";
import {
  Address,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseAbi,
  parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mantle } from "viem/chains";

export const CLIENT_SIGNATURE_MESSAGE = "Sign to check claim eligibility";
const SIG_DEADLINE = 3600;

export enum Errors {
  InvalidSignature = "Invalid signature",
  InvalidPayload = "Couldn't process the request",
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const SK = process.env.SK;
  const CONTRACT_ADDRESS = process.env.CONTRACT;

  // const walletClient = createWalletClient({
  //   account: privateKeyToAccount(SK),
  //   transport: http("https://base.llamarpc.com"),
  // });

  try {
    const body = JSON.parse(req.body);
    const arAddress = body.arAddress;
    const evmAddress = body.evmAddress;
    // const userSignedMessage = body.signedMessage;

    // if (
    //   address !=
    //   (await recoverMessageAddress({
    //     message: CLIENT_SIGNATURE_MESSAGE,
    //     signature: userSignedMessage,
    //   }))
    // ) {
    //   return res.status(500).json({ error: Errors.InvalidSignature });
    // }

    // const score = await fetch(
    //   `https://dre-1.warp.cc/contract?id=WTlvCuzEK4tTqVBwiCjXpkmnp-50l-DakASrPVRqTNI&query=$.users.${address}`
    // )
    //   .then((res) => res.json())
    //   .then(({ result }) => result[0].score);

    // const deadline = ~~(Date.now() / 1000 + SIG_DEADLINE);
    // const msgToSign = encodePacked(
    //   ["address", "uint", "uint"],
    //   [address, parseEther(score.toString()), BigInt(deadline)]
    // );

    // const signature = await walletClient.signMessage({
    //   message: { raw: hexToBytes(keccak256(msgToSign)) },
    // });

    // res.status(200).json({ signature, score });

    const walletClient = createWalletClient({
      // @ts-ignore
      account: privateKeyToAccount(SK),
      chain: mantle,
      transport: http(),
    });

    const publicClient = createPublicClient({
      chain: mantle,
      transport: http(),
    });
    // const l2RpcProvider = new ethers.JsonRpcProvider("https://rpc.sepolia.mantle.xyz")

    try {
      const feeData = await publicClient.estimateFeesPerGas();

      console.log(
        arAddress,
        evmAddress,
        await fetch(
          `https://dre-1.warp.cc/contract?id=WTlvCuzEK4tTqVBwiCjXpkmnp-50l-DakASrPVRqTNI&query=$.users.${arAddress}`
          //@ts-ignore
        ).then((res) => res.json())
      );

      const claimableAmount = (
        await fetch(
          `https://dre-1.warp.cc/contract?id=WTlvCuzEK4tTqVBwiCjXpkmnp-50l-DakASrPVRqTNI&query=$.users.${arAddress}`
          //@ts-ignore
        ).then((res) => res.json())
      ).result[0]?.score;

      if (!claimableAmount) {
        res.status(500).json({ error: Errors.InvalidPayload });

        return;
      }

      const tx = {
        // from: "0x69F77b2471e198dfae24164C9C97640695836f7D",
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        to: CONTRACT_ADDRESS as Address,
        data: encodeFunctionData({
          abi: parseAbi(["function mint(address to, uint256 amount)"]),
          functionName: "mint",
          args: [evmAddress, parseEther(claimableAmount.toString())],
        }),
      };

      // const estimatedGas = await publicClient.estimateGas(tx);
      // console.log(`Estimated gas: ${estimatedGas.toString()}`);
      // @ts-ignore
      // console.log(`Estimated totalCost for transaction: ${estimatedGas * feeData.maxFeePerGas}`);

      const tx2 = await walletClient.sendTransaction(tx);

      res.status(200).json({});
    } catch (error) {
      console.error("Error estimating gas:", error);
    }
    // res.status(200).json({ fee:  });
  } catch (e) {
    // @ts-ignore
    res.status(500).json({ error: Errors.InvalidPayload, message: e.message });
  }
}
