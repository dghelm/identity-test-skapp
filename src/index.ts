// TODO: Enable full eslints.

import { Interface, SkynetClient } from "skynet-js";
import { SkappInfo } from "skynet-interface-utils";

import { dev, skappName } from "./consts";

import {
  bridgeRestart,
  loginPopup,
  logout,
} from "./actions";
import { setUIStateBridgeError, setUIStateFetching, setUIStateLoggedIn, setUIStateNotLoggedIn } from "./ui";

// TODO: Should include a session token as well, so that other skapps can't impersonate this one.
export const skappInfo = new SkappInfo(skappName, location.hostname);

const mySkyInterface = {
  name: "MySky",
  version: "0.0.1",
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
        }
      ],
      returnType: "object",
    },
  },
};

export let bridgeSkylink: string;
export let client = dev ? new SkynetClient("https://siasky.net") : new SkynetClient();
export let mySky: Interface;

export const startSkapp = (async () => {
  // ==============
  // Initialization
  // ==============

  // Set the initial UI state.
  setUIStateFetching();

  // Get the base32 bridge skylink.
  bridgeSkylink = `
_ALYsClkNBT6xKXescnuTC2uIhKCR5VcmV7MnVAKS8Xwiw
`;
  bridgeSkylink = client.getSkylinkUrl(bridgeSkylink, { subdomain: true });

  // Initialize the gate.
  await client.gate.initialize(skappInfo, bridgeSkylink);
  mySky = await client.gate.loadInterface(mySkyInterface);

  // Try to login silently.
  try {
    await mySky.loginSilent();
    const identity: string = await mySky.identity();
    setUIStateLoggedIn(identity);
  } catch (err) {
    setUIStateNotLoggedIn();
  }
});

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
