import { activateUI, deactivateUI, setUIStateBridgeError, setUIStateLoggedIn, setUIStateNotLoggedIn } from "./ui";

import { client, mySky, startSkapp } from ".";
import { defaultProviderMySky, dev } from "./consts";

/**
 *
 */
export async function bridgeRestart(): Promise<void> {
  await client.destroyBridge();
  return startSkapp().catch((e) => {
    if (dev) {
      console.log(e);
    }
    setUIStateBridgeError();
  });
}

/**
 */
export async function loginPopup(): Promise<void> {
  deactivateUI();

  try {
    await mySky.loginPopup({ providers: [defaultProviderMySky] });
    const identity: string = await mySky.identity();
    setUIStateLoggedIn(identity);
  } catch (err) {
    if (dev) {
      console.log(err);
    }
  }

  activateUI();
}

/**
 * Disconnects from the currently connected provider.
 */
export async function logout(): Promise<void> {
  deactivateUI();

  try {
    await mySky.logout();
    setUIStateNotLoggedIn();
  } catch (err) {
    if (dev) {
      console.log(err);
    }
  }

  activateUI();
}
