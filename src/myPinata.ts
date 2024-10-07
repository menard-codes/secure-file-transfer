import { FileObject, PinataSDK } from "pinata";
import dotenv from "dotenv";

dotenv.config();

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY
});

export async function uploadFile(file: FileObject) {
    try {
        const upload = await pinata.upload.file(file);
        return upload;
    } catch (error) {
        console.error(error);
    }
}

export async function getFileUrl(cid: string, expires: number) {
    try {
        const signedUrl = await pinata.gateways.createSignedURL({
            cid,
            expires
        });
        return signedUrl;
    } catch (error) {
        // TODO: Error handling
    }
}



export async function deleteFile(fileId: string) {
    try {
        const deleted = await pinata.files.delete([fileId]);
        return deleted;
    } catch (error) {
        console.error(error);
    }
}
