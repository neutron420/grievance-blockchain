import { connectRedis, popComplaintFromQueue } from "./redisClient";
import { connectToFabric } from "./fabricClient";

async function startWorker() {
  console.log(" Worker Started...");

  // Connect Redis
  await connectRedis();
  console.log(" Connected to Redis");

  // Connect Fabric
  const contract = await connectToFabric();
  console.log(" Connected to Hyperledger Fabric");

  console.log(" Waiting for complaints...");

  while (true) {
    // Pop from Redis Queue
    const complaint = await popComplaintFromQueue();

    if (!complaint) {
      await new Promise((res) => setTimeout(res, 1000)); // sleep
      continue;
    }

    console.log(" Received complaint:", complaint.id);

    try {
      await contract.submitTransaction(
        "CreateComplaint",
        JSON.stringify(complaint)
      );

      console.log(" Stored in blockchain:", complaint.id);
    } catch (err) {
      console.error(" Error storing complaint:", err);
    }
  }
}

startWorker();
