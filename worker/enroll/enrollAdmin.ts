import { Wallets } from "fabric-network";
import FabricCAServices from "fabric-ca-client";
import path from "path";
import fs from "fs";

async function main() {
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

    const caURL = ccp.certificateAuthorities["ca.org1.example.com"].url;
    const ca = new FabricCAServices(caURL);

    const walletPath = path.resolve(
      process.env.HOME!,
      "grievance-blockchain",
      "worker",
      "wallet"
    );

    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const adminExists = await wallet.get("admin");
    if (adminExists) {
      console.log("Admin already enrolled.");
      return;
    }

    const enrollment = await ca.enroll({
      enrollmentID: "admin",
      enrollmentSecret: "adminpw",
    });

    const identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: "Org1MSP",
      type: "X.509",
    };

    await wallet.put("admin", identity);
    console.log("Admin enrolled successfully!");
    
  } catch (err) {
    console.error("Failed to enroll admin:", err);
  }
}

main();
