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

export async function scheduleFileDeletion(fileId: string, shareId: string, expiration: Date) {
    const now = new Date();
    const delay = Math.max(0, expiration.getTime() - now.getTime());
    
    console.log(`Scheduling deletion for file ${fileId} with delay: ${delay} ms`);
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Scheduled deletion time: ${new Date(now.getTime() + delay).toISOString()}`);
    
    const job = await fileDeleteQueue.add('delete', { fileId, shareId }, { delay });
    
    console.log(`Job created with ID: ${job.id}`);
    
    return job;
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
        console.log('DELETED', deletedFile, deletedFileRecord);
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
