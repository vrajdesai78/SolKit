<template>
  <div class="info-list">
    <section>
      <h2>Wallet Information</h2>
      <pre>
Address: {{ accountInfo.address }}
CAIP Address: {{ accountInfo.caipAddress }}
Connected: {{ accountInfo.isConnected }}
Status: {{ accountInfo.status }}
Account Type: {{ accountInfo.embeddedWalletInfo?.accountType || 'N/A' }}
<template v-if="accountInfo.embeddedWalletInfo?.user?.email">Email: {{ accountInfo.embeddedWalletInfo.user.email }}</template>
<template v-if="accountInfo.embeddedWalletInfo?.user?.username">Username: {{ accountInfo.embeddedWalletInfo.user.username }}</template>
<template v-if="accountInfo.embeddedWalletInfo?.authProvider">Provider: {{ accountInfo.embeddedWalletInfo.authProvider }}</template>
      </pre>
    </section>

    <section>
      <h2>Theme</h2>
      <pre>
Theme Mode: {{ kitTheme.themeMode }}
      </pre>
    </section>

    <section>
      <h2>State</h2>
      <pre>
Selected Network ID: {{ state.selectedNetworkId || "None" }}
Loading: {{ state.loading }}
Modal Open: {{ state.open }}
      </pre>
    </section>

    <section>
      <h2>Wallet Info</h2>
      <pre>
Name: {{ walletInfo.walletInfo?.name || "N/A" }}
      </pre>
    </section>
  </div>
</template>

<script>
import { onMounted } from "vue";
import {
  useAppKitState,
  useAppKitTheme,
  useAppKitEvents,
  useAppKitAccount,
  useWalletInfo,
} from "@reown/appkit/vue";

export default {
  name: "InfoList",
  setup() {
    const kitTheme = useAppKitTheme();
    const state = useAppKitState();
    const accountInfo = useAppKitAccount();
    const events = useAppKitEvents();
    const walletInfo = useWalletInfo();

    onMounted(() => {
      console.log("Events: ", events);
    });

    return {
      kitTheme,
      state,
      accountInfo,
      walletInfo,
    };
  },
};
</script>

<style scoped>
.info-list {
  margin-top: 32px;
}

section {
  margin-bottom: 24px;
}

h2 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}

pre {
  background-color: #f3f4f6;
  padding: 16px;
  border-radius: 4px;
  overflow: auto;
  line-height: 1.5;
  font-size: 14px;
}
</style>
