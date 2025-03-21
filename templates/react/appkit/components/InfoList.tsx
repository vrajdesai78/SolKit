import { useEffect } from "react";
import {
  useAppKitState,
  useAppKitTheme,
  useAppKitEvents,
  useAppKitAccount,
  useWalletInfo,
} from "@reown/appkit/react";
import { useClientMounted } from "../hooks/useClientMounted";

const InfoList = () => {
  const kitTheme = useAppKitTheme();
  const state = useAppKitState();
  const { address, caipAddress, isConnected, embeddedWalletInfo } =
    useAppKitAccount();
  const events = useAppKitEvents();
  const walletInfo = useWalletInfo();
  const mounted = useClientMounted();

  useEffect(() => {
    console.log("Events: ", events);
  }, [events]);

  if (!mounted) return null;

  const sectionStyle = {
    marginBottom: "24px",
  };

  const headingStyle = {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "8px",
  };

  const preStyle = {
    backgroundColor: "#f3f4f6",
    padding: "16px",
    borderRadius: "4px",
    overflow: "auto",
    fontSize: "14px",
  };

  return (
    <>
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Wallet Information</h2>
        <pre style={preStyle}>
          Address: {address}
          <br />
          CAIP Address: {caipAddress}
          <br />
          Connected: {isConnected.toString()}
          <br />
          Account Type: {embeddedWalletInfo?.accountType || "N/A"}
          <br />
          {embeddedWalletInfo?.user?.email &&
            `Email: ${embeddedWalletInfo.user.email}\n`}
          {embeddedWalletInfo?.user?.username &&
            `Username: ${embeddedWalletInfo.user.username}\n`}
          {embeddedWalletInfo?.authProvider &&
            `Provider: ${embeddedWalletInfo.authProvider}\n`}
        </pre>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Theme</h2>
        <pre style={preStyle}>
          Theme Mode: {kitTheme.themeMode}
          <br />
        </pre>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>State</h2>
        <pre style={preStyle}>
          Selected Network ID: {state.selectedNetworkId?.toString() || "None"}
          <br />
          Loading: {state.loading.toString()}
          <br />
          Modal Open: {state.open.toString()}
          <br />
        </pre>
      </section>

      <section style={sectionStyle}>
        <h2 style={headingStyle}>Wallet Info</h2>
        <pre style={preStyle}>
          Name: {walletInfo.walletInfo?.name || "N/A"}
          <br />
        </pre>
      </section>
    </>
  );
};

export default InfoList;
