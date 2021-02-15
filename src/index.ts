// TODO: Enable full eslints.

import { SkynetClient } from "skynet-js";

// TODO: Should the gate be in skynet-js?
import { Gate, SkappInfo } from "./gate";
import { bridgeRestart, connectProvider, disconnectProvider, fetchStoredProvider, loadNewProvider } from "./login";

export let bridgeSkylink = `
_AmgU7AqhQ0uzQ_s-fyhgXYKEBB_2aTp_51ShXL0gBRv0Q
`;

const skappName = "identity-test-skapp";
const dev = true;

// TODO: Should include a session token as well, so that other skapps can't impersonate this one.
export const skappInfo = new SkappInfo(skappName);

const client = dev ? new SkynetClient("https://siasky.net") : new SkynetClient();

// Get the base32 bridge skylink.
bridgeSkylink = client.getSkylinkUrl(bridgeSkylink, { subdomain: true });
console.log(`Bridge skylink: ${bridgeSkylink}`);

export const gate = new Gate(bridgeSkylink);

// Define button click functions.

(window as any).bridgeRestart = bridgeRestart;
(window as any).changeProvider = loadNewProvider;
(window as any).loginLoaded = connectProvider;
(window as any).loginLogout = disconnectProvider;
(window as any).loginNotLoaded = loadNewProvider;
(window as any).logout = disconnectProvider;

// Start the identity component.

(async () => {
  fetchStoredProvider();
})().catch((e) => {
  if (dev) {
    alert(e);
  } else {
    console.log(e);
  }
});
