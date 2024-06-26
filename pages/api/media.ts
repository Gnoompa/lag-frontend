import formidable from "formidable";
import fs from "fs";
import pinataSDK from "@pinata/sdk";
import { NextApiRequest, NextApiResponse } from "next";

const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });

export const config = {
    api: {
        bodyParser: false,
    },
};

const saveFile = async (file: formidable.File) => {
    try {
        const stream = fs.createReadStream(file.filepath);
        const options = {
            pinataMetadata: {
                name: file.originalFilename,
            },
        };
        const response = await pinata.pinFileToIPFS(stream, options);
        fs.unlinkSync(file.filepath);

        return response;
    } catch (error) {
        throw error;
    }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
    if (req.method === "POST") {
        try {
            const form = formidable();

            form.parse(req, async function (err, fields, files) {
                if (err || !files.file?.[0]) {
                    console.log({ err });
                    return res.status(500).send("Upload Error");
                }
                const { IpfsHash } = await saveFile(files.file?.[0]!);
                const metadata = await pinata.pinJSONToIPFS({
                    ...JSON.parse(fields.data?.[0]!),
                    image: IpfsHash,
                });

                return res.send(metadata.IpfsHash);
            });
        } catch (e) {
            console.log(e);
            res.status(500).send("Server Error");
        }
    } else {
        res.status(404).send("only POST");
    }
}
