"use client";

import { useEffect } from "react";
import {
  useAppKitState,
  useAppKitTheme,
  useAppKitEvents,
  useAppKitAccount,
  useWalletInfo,
} from "@reown/appkit/react";
import { useClientMounted } from "@/hooks/useClientMount";

export const InfoList = () => {
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

  return !mounted ? null : (
    <>
      <section className='mt-8'>
        <h2 className='text-xl font-bold mb-2'>Wallet Information</h2>
        <pre className='bg-gray-100 p-4 rounded text-sm overflow-auto'>
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

      <section className='mt-4'>
        <h2 className='text-xl font-bold mb-2'>Theme</h2>
        <pre className='bg-gray-100 p-4 rounded text-sm'>
          Theme Mode: {kitTheme.themeMode}
          <br />
        </pre>
      </section>

      <section className='mt-4'>
        <h2 className='text-xl font-bold mb-2'>State</h2>
        <pre className='bg-gray-100 p-4 rounded text-sm'>
          Selected Network ID: {state.selectedNetworkId?.toString() || "None"}
          <br />
          Loading: {state.loading.toString()}
          <br />
          Modal Open: {state.open.toString()}
          <br />
        </pre>
      </section>

      <section className='mt-4 mb-8'>
        <h2 className='text-xl font-bold mb-2'>Wallet Info</h2>
        <pre className='bg-gray-100 p-4 rounded text-sm'>
          Name: {walletInfo.walletInfo?.name || "N/A"}
          <br />
        </pre>
      </section>
    </>
  );
};
