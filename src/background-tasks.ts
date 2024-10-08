import { Queue, Worker, type Job } from "bullmq";
import prisma from "./db";
import { deleteFile } from "./myPinata";
import dotenv from "dotenv";

dotenv.config();

interface FileDeleteJob {
    fileId: string;
    shareId: string;
}

const connection = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT || 6379)
};

const fileDeleteQueue = new Queue('fileDelete', { connection });

export async function scheduleFileDeletion(fileId: FileDeleteJob['fileId'], shareId: FileDeleteJob['shareId'], expiration: Date) {
    const delay = Number(expiration) - Number(new Date());
    await fileDeleteQueue.add('delete', { fileId, shareId }, { delay });
}

const worker = new Worker('fileDelete', async (job: Job<FileDeleteJob>) => {
    const { fileId, shareId } = job.data;

    try {
        // TODO: Verify that the expiration date on record === expiration on job data
        const deletedFile = await deleteFile(fileId);
        const deletedFileRecord = await prisma.$transaction(async (tx) => {
            const deletedShareFile = await tx.share.delete({
                where: { id: shareId },
            });
            return tx.view.delete({
                where: {
                    id: deletedShareFile.viewId
                }
            });
        });
        // TODO: Logger
        console.log(deletedFile, deletedFileRecord);
    } catch (error) {
        console.error(error);
    }
}, { connection });

worker.on('failed', () => {
    // TODO: Retry failed jobs
    console.error('Failed job');
});

process.on('SIGTERM', async () => {
    await worker.close();
    await fileDeleteQueue.close();
    await prisma.$disconnect();
    process.exit(0);
});
