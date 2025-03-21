<template>
  <div class="action-buttons">
    <button @click="openAppKit" class="btn btn-primary">Open</button>
    <button @click="handleDisconnect" class="btn btn-danger">Disconnect</button>
    <button @click="switchToNetwork" class="btn btn-success">
      Switch Network
    </button>
  </div>
</template>

<script>
import { useDisconnect, useAppKit, useAppKitNetwork } from "@reown/appkit/vue";
import { networks } from "../config/index";

export default {
  name: "ActionButtonList",
  setup() {
    const { disconnect } = useDisconnect();
    const { open } = useAppKit();
    const networkData = useAppKitNetwork();

    const openAppKit = () => open();
    const switchToNetwork = () => networkData.value.switchNetwork(networks[1]);
    const handleDisconnect = async () => {
      try {
        await disconnect();
      } catch (error) {
        console.error("Error during disconnect:", error);
      }
    };

    return {
      handleDisconnect,
      openAppKit,
      switchToNetwork,
    };
  },
};
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-success {
  background-color: #10b981;
  color: white;
}
</style>
