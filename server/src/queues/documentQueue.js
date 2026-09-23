import { Queue } from 'bullmq';
import { bullConnection } from '../config/redis.js';

export const QUEUE_NAME = 'document-queue';
export const JOB_NAME = 'process-document';

/** Producer side of the pipeline; used by the API to enqueue uploads. */
export const documentQueue = new Queue(QUEUE_NAME, { connection: bullConnection });

export function enqueueDocumentJob(data) {
  return documentQueue.add(JOB_NAME, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 15_000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  });
}
