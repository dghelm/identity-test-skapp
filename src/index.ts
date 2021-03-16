// TODO: Enable full eslints.

import { MySkyInstance, SkynetClient } from "skynet-js";

import { dev } from "./consts";

import { bridgeRestart, loginPopup, logout } from "./actions";
import { setUIStateBridgeError, setUIStateFetching, setUIStateLoggedIn, setUIStateNotLoggedIn } from "./ui";

const portalUrl = dev ? "https://siasky.net" : "";
export const client = new SkynetClient(portalUrl);
export let mySky: MySkyInstance;

export const startSkapp = async () => {
  // ==============
  // Initialization
  // ==============

  // Set the initial UI state.
  setUIStateFetching();

  // Initialize the bridge.
  mySky = await client.loadMySky();

  // Try to login silently.
  try {
    await mySky.loginSilent();
    const identity: string = await mySky.identity();
    setUIStateLoggedIn(identity);
  } catch (err) {
    setUIStateNotLoggedIn();
  }
};

// ==========================
// Define button click events
// ==========================

(window as any).bridgeRestart = bridgeRestart;

(window as any).login = loginPopup;
(window as any).logout = logout;

// ===============
// START EXECUTION
// ===============

startSkapp().catch((e) => {
  if (dev) {
    console.log(e);
  }
  setUIStateBridgeError();
});
