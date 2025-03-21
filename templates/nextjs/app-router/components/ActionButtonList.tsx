"use client";

import {
  useDisconnect,
  useAppKit,
  useAppKitNetwork,
} from "@reown/appkit/react";
import { networks } from "@/config";

export const ActionButtonList = () => {
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const { switchNetwork } = useAppKitNetwork();

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  return (
    <div className='flex gap-2 my-4'>
      <button
        className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        onClick={() => open()}
      >
        Open
      </button>
      <button
        className='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
        onClick={handleDisconnect}
      >
        Disconnect
      </button>
      <button
        className='px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600'
        onClick={() => switchNetwork(networks[1])}
      >
        Switch Network
      </button>
    </div>
  );
};
