import {
  activateUI,
  deactivateUI,
  setUIStateBridgeError,
  setUIStateLoggedIn,
  setUIStateNotLoggedIn,
} from "./ui";

import { client, mySky, startSkapp } from ".";
import { dev } from "./consts";

export async function bridgeRestart(): Promise<void> {
  await client.gate.destroy();
  return startSkapp().catch((e) => {
    if (dev) {
      alert(e);
    } else {
      console.log(e);
    }
    setUIStateBridgeError();
  });
}

/**
 */
export async function loginPopup(): Promise<void> {
  deactivateUI();

  await mySky.loginPopup();
  const identity: string = await mySky.identity();
  setUIStateLoggedIn(identity);

  activateUI();
}

/**
 * Disconnects from the currently connected provider.
 */
export async function logout(): Promise<void> {
  deactivateUI();

  await mySky.logout();
  setUIStateNotLoggedIn();

  activateUI();
}
