import type { ProviderInfo } from "./gate";

const uiIdentityBridgeError = document.getElementById("identity-bridge-error");
const uiIdentityConnected = document.getElementById("identity-connected");
const uiIdentityFetching = document.getElementById("identity-fetching");
const uiIdentityLoaded = document.getElementById("identity-loaded");
const uiIdentityNotLoaded = document.getElementById("identity-not-loaded");

/**
 *
 */
export function activateUI() {
  document.getElementById("darkLayer")!.style.display = "none";
}

/**
 *
 */
export function deactivateUI() {
  document.getElementById("darkLayer")!.style.display = "";
}

/**
 * Set the UI state to indicate that the bridge could not be loaded.
 */
export function setUIStateBridgeError() {
  setAllIdentityContainersInvisible();
  uiIdentityBridgeError!.style.display = "block";
}

/**
 * @param providerInfo
 * @param identity
 */
export function setUIStateConnected(providerInfo: ProviderInfo, identity: string) {
  if (!providerInfo.metadata) {
    throw new Error("logic bug");
  }

  setAllIdentityContainersInvisible();
  uiIdentityConnected!.style.display = "block";

  document.getElementById("identity-connected-identity")!.textContent = identity;
  document.getElementById("identity-connected-provider")!.textContent = providerInfo.metadata.name;
}

/**
 *
 */
export function setUIStateFetching() {
  setAllIdentityContainersInvisible();
  uiIdentityFetching!.style.display = "block";
}

/**
 * @param providerInfo
 */
export function setUIStateLoaded(providerInfo: ProviderInfo) {
  if (!providerInfo.metadata) {
    throw new Error("logic bug");
  }

  setAllIdentityContainersInvisible();
  uiIdentityLoaded!.style.display = "block";

  document.getElementById("identity-loaded-provider")!.textContent = providerInfo.metadata.name;
}

/**
 *
 */
export function setUIStateNotLoaded() {
  setAllIdentityContainersInvisible();
  uiIdentityNotLoaded!.style.display = "block";
}

/**
 *
 */
function setAllIdentityContainersInvisible() {
  uiIdentityBridgeError!.style.display = "none";
  uiIdentityConnected!.style.display = "none";
  uiIdentityFetching!.style.display = "none";
  uiIdentityLoaded!.style.display = "none";
  uiIdentityNotLoaded!.style.display = "none";
}
