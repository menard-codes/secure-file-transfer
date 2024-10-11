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

export async function getFileUrl(cid: string, expires=1800) {
    try {
        const signedUrl = await pinata.gateways.createSignedURL({
            cid,
            expires // defaults to 30 minutes (1800 seconds)
        });
        return signedUrl;
    } catch (error) {
        // TODO: Error handling
        console.error(error);
    }
}

export async function getFile(cid: string) {
    try {
        const file = await pinata.gateways.get(cid);
        return file;
    } catch (error) {
        // TODO: Better error handling
        console.error(error);
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
