import { Gateway, Wallets } from "fabric-network";
import * as fs from "fs";
import * as path from "path";

export async function connectToFabric() {
  try {
    // Path to connection profile
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

    // Wallet path
    const walletPath = path.resolve(process.env.HOME!, "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get("appUser");
    if (!identity) {
      throw new Error(" appUser not found in wallet");
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: "appUser",
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork("grievancechannel");
    const contract = network.getContract("grievancecc");

    console.log(" Connected to Fabric via gateway");
    return contract;
  } catch (err) {
    console.error(" Error connecting to Fabric:", err);
    throw err;
  }
}
