// TODO: Enable full eslints.

import { SkynetClient } from "skynet-js";
import { dev, skappName } from "./consts";

// TODO: Should the gate be in skynet-js?
import { Gate } from "./gate";
import {
  bridgeRestart,
  connectProvider,
  disconnectProvider,
  errorOk,
  fetchStoredProvider,
  loadNewProvider,
} from "./actions";
import { setUIStateFetching } from "./ui";

// ==============
// Initialization
// ==============

// Set the initial UI state.
setUIStateFetching();

// TODO: Should include a session token as well, so that other skapps can't impersonate this one.
export const skappInfo = { name: skappName, domain: location.hostname };

const client = dev ? new SkynetClient("https://siasky.net") : new SkynetClient();

// Get the base32 bridge skylink.
export let bridgeSkylink = `
_A2b66qnahwfL51mQSDpk0wg_3P0xcs0RigZQdPWI6ZHeQ
`;
bridgeSkylink = client.getSkylinkUrl(bridgeSkylink, { subdomain: true });
console.log(`Bridge skylink: ${bridgeSkylink}`);

export const gate = new Gate(client, bridgeSkylink);

// ==========================
// Define button click events
// ==========================

(window as any).bridgeRestart = bridgeRestart;

(window as any).errorOk = errorOk;

(window as any).selectProvider = loadNewProvider;

(window as any).changeProvider = loadNewProvider;
(window as any).login = connectProvider;

(window as any).logout = disconnectProvider;

// ===============
// START EXECUTION
// ===============

(async () => {
  fetchStoredProvider();
})().catch((e) => {
  if (dev) {
    alert(e);
  } else {
    console.log(e);
  }
});
