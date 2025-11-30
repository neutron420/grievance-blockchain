import { Gateway, Wallets } from "fabric-network";
import * as fs from "fs";
import * as path from "path";

export async function connectToFabric() {
  try {
    const ccpPath = path.resolve(
      process.env.HOME!,
      "grievance-blockchain",
      "fabric",
      "organizations",
      "peerOrganizations",
      "org1.example.com",
      "connection-org1.json"
    );

    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
  
    const walletPath = path.join(process.env.HOME!, "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Use admin identity
    const identity = await wallet.get("admin");
    if (!identity) {
      throw new Error(" admin not found in wallet");
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: "admin",
      discovery: { 
        enabled: false,
        asLocalhost: true 
      },
    });

    const network = await gateway.getNetwork("grievancechannel");
    const contract = network.getContract("grievancecc");

    console.log("Connected to Fabric via gateway (using admin)");
    return contract;
  } catch (err) {
    console.error(" Error connecting to Fabric:", err);
    throw err;
  }
}
