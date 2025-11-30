import { createClient } from "redis";

export const redisClient = createClient({
  url: "redis://localhost:6379"
});

redisClient.on("error", (err) => {
  console.error(" Redis Client Error:", err);
});

export async function connectRedis() {
  await redisClient.connect();
  console.log(" Connected to Redis");
}

export async function pushComplaintToQueue(complaint: any) {
  await redisClient.rPush("complaintsQueue", JSON.stringify(complaint));
}

export async function popComplaintFromQueue() {
  const data = await redisClient.lPop("complaintsQueue");
  return data ? JSON.parse(data) : null;
}
