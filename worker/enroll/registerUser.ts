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

    const walletPath = path.join(process.env.HOME!, "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check admin exists
    const admin = await wallet.get("admin");
    if (!admin) {
      throw new Error("Admin not enrolled yet.");
    }

    // Create a provider for admin identity
    const provider = wallet.getProviderRegistry().getProvider(admin.type);
    const adminUser = await provider.getUserContext(admin, "admin");

    // Check if appUser exists
    const userExists = await wallet.get("appUser");
    if (userExists) {
      console.log("appUser already exists in the wallet.");
      return;
    }

    // Register appUser (simple registration without special attributes)
    const secret = await ca.register(
      {
        affiliation: "org1.department1",
        enrollmentID: "appUser",
        role: "client",
      },
      adminUser
    );

    // Enroll appUser
    const enrollment = await ca.enroll({
      enrollmentID: "appUser",
      enrollmentSecret: secret,
    });

    const userIdentity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: "Org1MSP",
      type: "X.509",
    };

    await wallet.put("appUser", userIdentity);
    console.log("✅ Registered and enrolled appUser");

  } catch (err) {
    console.error("❌ Failed to register appUser:", err);
  }
}

main();
