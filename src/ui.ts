import type { ProviderInfo } from "./gate";

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

// TODO
/**
 * Set the UI state to indicate that the bridge could not be loaded.
 */
export function setUIStateBridgeError() {
  throw new Error("not implemented");
}

/**
 * @param providerInfo
 * @param identity
 */
export function setUIStateConnected(providerInfo: ProviderInfo, identity: string) {
  setAllIdentityContainersInvisible();
  uiIdentityConnected!.style.display = "block";

  document.getElementById("identity-connected-identity")!.textContent = identity;
  document.getElementById("identity-connected-provider")!.textContent = providerInfo.providerName;
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
  setAllIdentityContainersInvisible();
  uiIdentityLoaded!.style.display = "block";

  document.getElementById("identity-loaded-provider")!.textContent = providerInfo.providerName;
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
  uiIdentityFetching!.style.display = "none";
  uiIdentityConnected!.style.display = "none";
}
