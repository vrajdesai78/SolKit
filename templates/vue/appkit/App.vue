<template>
  <div class="app-container">
    <h1>AppKit Solana Integration</h1>

    <div class="connect-section">
      <h2>Connect Your Wallet</h2>
      <appkit-button />
      <ActionButtonList />
    </div>

    <div class="notice">
      <p>
        Note: The default projectId only works on localhost.
        <br />Go to
        <a
          href="https://cloud.reown.com"
          target="_blank"
          rel="noopener noreferrer"
          >Reown Cloud</a
        >
        to get your own.
      </p>
    </div>

    <InfoList />
  </div>
</template>

<script>
import {
  createAppKit,
} from '@reown/appkit/vue'
import { solanaWeb3JsAdapter, networks, projectId } from './config/index'
import ActionButtonList from "./components/ActionButton.vue"
import InfoList from "./components/InfoList.vue"

// Initialize AppKit
createAppKit({
  adapters: [solanaWeb3JsAdapter],
  networks,
  projectId,
  themeMode: '{{projectInfo.themeMode}}',
  features: {
    analytics: {{projectInfo.analytics}} // Optional - defaults to your Cloud configuration
  },
  metadata: {
    name: '{{projectInfo.name}}',
    description: '{{projectInfo.description}}',
    url: '{{projectInfo.url}}',
    icons: ['{{projectInfo.icon}}']
  },
  themeVariables: {
    '--w3m-accent': '{{projectInfo.accentColor}}',
  }
})

export default {
  name: "App",
  components: {
    ActionButtonList,
    InfoList
  },
};
</script>

<style>
.app-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.connect-section {
  margin-bottom: 2rem;
}

.notice {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #fffbea;
  border: 1px solid #fef3c7;
  border-radius: 0.375rem;
}

.notice p {
  color: #92400e;
  line-height: 1.5;
}

.notice a {
  color: #1e40af;
  text-decoration: underline;
}
</style>
