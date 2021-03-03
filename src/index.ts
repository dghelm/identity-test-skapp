// TODO: Enable full eslints.

import { SkynetClient } from "skynet-js";
import { dev, skappName } from "./consts";

// TODO: Should the gate be in skynet-js?
import {
  bridgeRestart,
  errorOk,
} from "./actions";
import { setUIStateFetching, setUIStateLoggedIn, setUIStateNotLoggedIn } from "./ui";

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
_ALgFDoi9-FS7JBdXTpvne779WcG7JLLiwZHtz43m1-gyw
`;
bridgeSkylink = client.getSkylinkUrl(bridgeSkylink, { subdomain: true });

// Initialize the gate.
client.gate.initialize(bridgeSkylink);

// ==========================
// Define button click events
// ==========================

(window as any).bridgeRestart = bridgeRestart;
(window as any).errorOk = errorOk;

(window as any).login = loginPopup;
(window as any).logout = logout;

// ===============
// START EXECUTION
// ===============

(async () => {

  try {
    const { providerStatus, identity } = loginSilent();
    setUIStateLoggedIn(providerStatus, identity);
  } catch {
    setUIStateNotLoggedIn();
  }
})().catch((e) => {
  if (dev) {
    alert(e);
  } else {
    console.log(e);
  }
});
