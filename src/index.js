import { SkynetClient } from 'skynet-js';

// TODO: Should the gate be in skynet-js?
import { Gate } from "./gate";
import { setStateLoggedIn, setStateLoggedOut } from "./ui";

const dev = true;

const client = dev ? new SkynetClient("https://siasky.net") : new SkynetClient();
let bridgeSkylink = "https://siasky.net/CACZSMGLHkCKzd-4KyX209SqgQaz9UpWc7fuNu7QE2cFGA";
bridgeSkylink = client.getSkylinkUrl(bridgeSkylink, { subdomain: true });
console.log(bridgeSkylink);
const gate = new Gate(bridgeSkylink);

// Define button click functions.

window.login = async function () {
  try {
    gate.login();
  } catch (err) {
    return;
  }

  const identity = await gate.identity();
  setStateLoggedIn(identity);
};

window.logout = function () {
  try {
    gate.logout();
  } catch (err) {
    return;
  }

  setStateLoggedOut();
};

// Run this code on page load.

(async () => {
  const is = await gate.isLoggedIn();
  console.log(is);
  const id = await gate.identity();
  console.log(id);

  if (is) {
    setStateLoggedIn(id);
  } else {
    setStateLoggedOut();
  }
})().catch(e => {
  console.log(e);
});
