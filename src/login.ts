// TODO: Error-checking on bridge calls.

import { gate } from "./index";
import {
  activateUI,
  deactivateUI,
  setUIStateConnected,
  setUIStateFetching,
  setUIStateLoaded,
  setUIStateNotLoaded,
} from "./ui";

import type { ProviderInfo } from "./gate";

/**
 * Connects to the currently loaded provider.
 */
export async function connectProvider(): Promise<void> {
  deactivateUI();

  return gate
    .connectProvider()
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
 *
 */
export async function fetchStoredProvider(): Promise<void> {
  setUIStateFetching();

  return gate.fetchStoredProvider().then(async (info) => changeSkappState(info));
}

/**
 *
 */
export async function loadNewProvider(): Promise<void> {
  deactivateUI();

  return gate
    .loadProvider()
    .then(async (info) => changeSkappState(info))
    .then(() => activateUI());
}

/**
 * Changes the skapp state to either not-loaded, loaded, or connected, depending on the state of the provider.
 *
 * @param providerInfo - The provider info.
 */
async function changeSkappState(providerInfo: ProviderInfo): Promise<void> {
  console.log(providerInfo);
  const { isProviderConnected, isProviderLoaded } = providerInfo;

  if (isProviderLoaded) {
    if (isProviderConnected) {
      return gate.callInterface("identity").then((identity: string) => setUIStateConnected(providerInfo, identity));
    } else {
      setUIStateLoaded(providerInfo);
    }
  } else {
    setUIStateNotLoaded();
  }
}
