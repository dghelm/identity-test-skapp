// TODO: Enable full eslints.

import { SkynetClient } from "skynet-js";

// TODO: Should the gate be in skynet-js?
import { Gate, SkappInfo } from "./gate";
import { connectProvider, disconnectProvider, fetchStoredProvider, loadNewProvider } from "./login";

export let gate: Gate;

const skappName = "identity-test-skapp";
const dev = true;

const client = dev ? new SkynetClient("https://siasky.net") : new SkynetClient();

let bridgeSkylink = "https://siasky.net/CACZSMGLHkCKzd-4KyX209SqgQaz9UpWc7fuNu7QE2cFGA";
bridgeSkylink = client.getSkylinkUrl(bridgeSkylink, { subdomain: true });
console.log(bridgeSkylink);

// TODO: Should include a session token as well, so that other skapps can't impersonate this one.
const skappInfo = new SkappInfo(skappName);

// Initialize the identity state.

(async () => {
  // Wait for the bridge to be loaded.
  gate = await Gate.loadBridge(bridgeSkylink, skappInfo);

  fetchStoredProvider();
})().catch((e) => {
  if (dev) {
    alert(e);
  } else {
    console.log(e);
  }
});

// Define button click functions.

(window as any).changeProvider = loadNewProvider;
(window as any).loginLoaded = connectProvider;
(window as any).loginNotLoaded = loadNewProvider;
(window as any).logout = disconnectProvider;
