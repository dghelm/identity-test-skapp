// TODO: Enable full eslints.

import { SkynetClient } from "skynet-js";

// TODO: Should the gate be in skynet-js?
import { Gate, SkappInfo } from "./gate";
import { connectProvider, disconnectProvider, fetchStoredProvider, loadNewProvider } from "./login";

const skappName = "identity-test-skapp";
const dev = true;
let bridgeSkylink = "https://siasky.net/bAAQTne0foHBy5-HvLCIvPnetEnOjjabDyNoutgoTHZqaQ";

// TODO: Should include a session token as well, so that other skapps can't impersonate this one.
export const skappInfo = new SkappInfo(skappName);

const client = dev ? new SkynetClient("https://siasky.net") : new SkynetClient();

bridgeSkylink = client.getSkylinkUrl(bridgeSkylink, { subdomain: true });
console.log(`Bridge skylink: ${bridgeSkylink}`);

export const gate = new Gate(bridgeSkylink);

// Initialize the identity state.

(async () => {
  // Wait for the bridge to be loaded.
  await gate.bridgeConnection.promise;

  fetchStoredProvider();
})().catch((e) => {
  if (dev) {
    alert(e);
  } else {
    console.log(e);
  }
});

// Define button click functions.

(window as any).bridgeRestart = fetchStoredProvider;
(window as any).changeProvider = loadNewProvider;
(window as any).loginLoaded = connectProvider;
(window as any).loginNotLoaded = loadNewProvider;
(window as any).logout = disconnectProvider;
