import { popComplaintFromQueue } from "./redisClient";
import { connectToFabric } from "./fabricClient";


async function start() {
  console.log("Worker started Listening for complaints...");

  while (true) {
    const complaint = await popComplaintFromQueue();

    if (complaint) {
      console.log("Processing:", complaint.id);
      const contract = await connectToFabric();
      await contract.submitTransaction("CreateComplaint", JSON.stringify(complaint));
      console.log("Stored in blockchain:", complaint.id);
    }

    await new Promise(res => setTimeout(res, 1000)); // sleep
  }
}

start();
