// TODO: Error-checking on bridge calls.

import { gate, skappInfo } from "./index";
import {
  activateUI,
  deactivateUI,
  setUIStateBridgeError,
  setUIStateConnected,
  setUIStateError,
  setUIStateFetching,
  setUIStateLoaded,
  setUIStateNotLoaded,
} from "./ui";

import { ProviderInfo } from "./gate";

export async function bridgeRestart(): Promise<void> {
  // Don't await here on purpose.
  gate.restartBridge();
  return fetchStoredProvider();
}

/**
 * Connects to the currently loaded provider.
 */
export async function connectProvider(): Promise<void> {
  deactivateUI();

  try {
    const info = await gate.connectProvider(skappInfo);
    await changeSkappState(info);
  } catch (error) {
    setSkappErrorState(error);
  }

  activateUI();
}

/**
 * Disconnects from the currently connected provider.
 */
export async function disconnectProvider(): Promise<void> {
  deactivateUI();

  try {
    const info = await gate.disconnectProvider();
    await changeSkappState(info);
  } catch (error) {
    // Could not disconnect the provider. Forcefully unload it.
    await gate.unloadProvider();
    setSkappErrorState(error);
  }

  activateUI();
}

export async function errorOk(): Promise<void> {
  await changeSkappState(gate.providerInfo);
}

/**
 * Fetches the stored provider and if found, tries to connect.
 */
export async function fetchStoredProvider(): Promise<void> {
  setUIStateFetching();

  await gate.bridgeConnection.promise
    .catch(() => {
      setUIStateBridgeError();
    });

  try {
    const info = await gate.fetchStoredProvider(skappInfo);
    await changeSkappState(info);
  } catch (error) {
    setSkappErrorState(error);
  }
}

/**
 * Loads a new provider, asking the router for the provider first.
 */
export async function loadNewProvider(): Promise<void> {
  deactivateUI();

  try {
    const info = await gate.loadNewProvider(skappInfo);
    await changeSkappState(info);
  } catch (error) {
    setSkappErrorState(error);
  }

  activateUI();
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
        // Disconnect the provider as it couldn't fulfil the identity interface. This will set the UI state to "Loaded".
        await gate.disconnectProvider();
      }
    } else {
      setUIStateLoaded(providerInfo);
    }
  } else {
    setUIStateNotLoaded();
  }
}

function setSkappErrorState(error: string): void {
  setUIStateError(error);
}
