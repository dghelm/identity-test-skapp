export const elementBridgeContainer = document.getElementById("bridge-container");

const elementLoginTrigger = document.getElementById("login-trigger");
const elementLogoutTrigger = document.getElementById("logout-trigger");
const elementLoginInfo = document.getElementById("login-info");

export function setStateLoggedOut() {
  elementLoginTrigger.style.display = "block";
  elementLogoutTrigger.style.display = "none";
  elementLoginInfo.style.display = "none";
}

export function setStateLoggedIn(identity) {
  elementLoginTrigger.style.display = "none";
  elementLogoutTrigger.style.display = "block";
  elementLoginInfo.style.display = "block";
  elementLoginInfo.innerHTML = `Logged in as ${identity}`;
}
