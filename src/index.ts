// TODO: Enable full eslints.

import { InterfaceInstance, SkynetClient } from "skynet-js";
import { SkappInfo } from "skynet-interface-utils";

import { bridgeSkylink, dev, skappName } from "./consts";

import { bridgeRestart, loginPopup, logout } from "./actions";
import { setUIStateBridgeError, setUIStateFetching, setUIStateLoggedIn, setUIStateNotLoggedIn } from "./ui";

// TODO: Should include a session token as well, so that other skapps can't impersonate this one.
export const skappInfo = new SkappInfo(skappName, location.hostname);

const mySkyInterface = {
  name: "MySky",
  version: "0.0.1",
  mysky: true,
  methods: {
    identity: {
      parameters: [],
      returnType: "string",
    },
    getJSON: {
      parameters: [
        {
          name: "dataKey",
          type: "string",
        },
        {
          name: "customOptions",
          type: "object",
          optional: true,
        },
      ],
      returnType: "object",
    },
  },
};

export const client = dev ? new SkynetClient("https://siasky.net") : new SkynetClient();
export let mySky: InterfaceInstance;

export const startSkapp = async () => {
  // ==============
  // Initialization
  // ==============

  // Set the initial UI state.
  setUIStateFetching();

  // Get the base32 bridge skylink.
  const bridgeSkylinkBase32 = client.getSkylinkUrl(bridgeSkylink, { subdomain: true });

  // Initialize the bridge.
  await client.bridge.initialize(skappInfo, bridgeSkylinkBase32);
  mySky = await client.bridge.loadMySky(mySkyInterface);

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
