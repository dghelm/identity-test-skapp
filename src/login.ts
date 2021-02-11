// TODO: Error-checking on bridge calls.

import { gate, skappInfo } from "./index";
import {
  activateUI,
  deactivateUI,
  setUIStateBridgeError,
  setUIStateConnected,
  setUIStateFetching,
  setUIStateLoaded,
  setUIStateNotLoaded,
} from "./ui";

import { ProviderInfo } from "./gate";

export async function bridgeRestart(): Promise<void> {
  gate.restartBridge();
  return fetchStoredProvider();
}

/**
 * Connects to the currently loaded provider.
 */
export async function connectProvider(): Promise<void> {
  deactivateUI();

  return gate
    .connectProvider(skappInfo)
    .then(async (info) => changeSkappState(info))
    .then(() => activateUI());
}

/**
 * Disconnects from the currently connected provider.
 */
export async function disconnectProvider(): Promise<void> {
  deactivateUI();

  return gate
    .disconnectProvider()
    .then(async (info) => changeSkappState(info))
    .then(() => activateUI());
}

/**
 * Fetches the stored provider and if found, tries to connect.
 */
export async function fetchStoredProvider(): Promise<void> {
  setUIStateFetching();

  await gate.bridgeConnection.promise
    .catch((error) => {
      setUIStateBridgeError();
      console.log(error);
    });

  // TODO: remove, testing fetching screen
  await new Promise(resolve => setTimeout(resolve, 1000));

  return gate
    .fetchStoredProvider(skappInfo)
    .then(async (info) => changeSkappState(info))
}

/**
 * Loads a new provider, asking the router for the provider first.
 */
export async function loadNewProvider(): Promise<void> {
  deactivateUI();

  return gate
    .loadNewProvider(skappInfo)
    .then(async (info) => changeSkappState(info))
    .then(() => activateUI());
}

/**
 * Changes the skapp state to either not-loaded, loaded, or connected, depending on the state of the provider.
 *
 * @param providerInfo - The provider info.
 */
async function changeSkappState(providerInfo: ProviderInfo): Promise<void> {
  const { isProviderConnected, isProviderLoaded } = providerInfo;

  if (isProviderLoaded) {
    if (isProviderConnected) {
      let identity;
      try {
        identity = await gate.callInterface("identity");
        if (typeof identity !== "string") {
          throw new Error("returned identity is not a string");
        }

        setUIStateConnected(providerInfo, identity);
      } catch (error) {
        console.log(error);
        // TODO: Cleanup connection status.
        setUIStateLoaded(providerInfo);
      }
    } else {
      setUIStateLoaded(providerInfo);
    }
  } else {
    setUIStateNotLoaded();
  }
}
