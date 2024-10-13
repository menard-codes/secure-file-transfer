import { ConnectionOptions, Queue, Worker, type Job } from "bullmq";
import prisma from "./db.ts";
import { deleteFile } from "./myPinata.ts";
import dotenv from "dotenv";

dotenv.config();

interface FileDeleteJob {
    fileId: string;
    shareId: string;
}

const connection: ConnectionOptions = {
    url: process.env.REDIS_URL
};

const fileDeleteQueue = new Queue('fileDelete', { connection });

export async function scheduleFileDeletion(fileId: string, shareId: string, expiration: Date) {
    const now = new Date();
    const delay = Math.max(0, expiration.getTime() - now.getTime());
    
    console.log(`Scheduling deletion for file ${fileId} with delay: ${delay} ms`);
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Scheduled deletion time: ${new Date(now.getTime() + delay).toISOString()}`);
    
    const job = await fileDeleteQueue.add('delete', { fileId, shareId }, {
        delay,
        jobId: `delete-${fileId}-${shareId}`
    });
    
    console.log(`Job created with ID: ${job.id}`);
    
    return job;
}

export async function rescheduleFileDeletion(fileId: string, shareId: string, newMsDelay: number, skipIfExistingDelayIsLower=true) {
    const jobId = `delete-${fileId}-${shareId}`;
    const job = await fileDeleteQueue.getJob(jobId);
    if (job) {
        if (skipIfExistingDelayIsLower && job.delay <= newMsDelay) {
            console.log('Skipping job rescheduling', jobId);
            return;
        }

        console.log(`Rescheduling Job: ${jobId}. Updated time for scheduled deletion: ${newMsDelay / 1000 / 60} minutes`);
        await job.changeDelay(newMsDelay);
    } else {
        console.log(`Job "${jobId}" not found`);
    }
}

export async function manuallyDeleteFile(fileId: string, shareId: string) {
    try {
        // Remove any scheduled deletion job
        await fileDeleteQueue.remove(`delete-${fileId}-${shareId}`);

        await deleteFile(fileId);
        await prisma.$transaction(async (tx) => {
            const share = await tx.share.findUnique({
                where: { id: shareId }
            });
            if (share) {
                await tx.share.delete({ where: { id: shareId } });
                await tx.view.delete({
                    where: { id: share.viewId }
                });
            }
        });

        console.log(`File ${fileId} manually deleted and job removed`);
    } catch (error) {
        console.error(error);
    }
}

const worker = new Worker('fileDelete', async (job: Job<FileDeleteJob>) => {
    const { fileId, shareId } = job.data;

    try {
        const deletedFile = await deleteFile(fileId);
        await prisma.$transaction(async (tx) => {
            const share = await tx.share.findUnique({
                where: { id: shareId }
            });
            if (share) {
                await tx.share.delete({ where: { id: shareId } });
                await tx.view.delete({
                    where: { id: share.viewId }
                });
            }
        });
        console.log('DELETED', deletedFile);
    } catch (error) {
        console.error(error);
    }
}, { connection });

worker.on('failed', () => {
    console.error('Failed job');
});

process.on('SIGTERM', async () => {
    await worker.close();
    await fileDeleteQueue.close();
    await prisma.$disconnect();
    process.exit(0);
});
