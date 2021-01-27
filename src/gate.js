import Postmate from "postmate";

import { elementBridgeContainer } from "./ui";
import { getIframeByName } from "./utils";

export class Gate {
  constructor(bridgeUrl) {
	if (typeof(Storage) == 'undefined') {
	  throw new Error('Browser does not support web storage')
	}

    // Launch the iframe with the bridge.

    const name = `iframe-${bridgeUrl}`;
    const handshake = new Postmate({
      container: elementBridgeContainer,
      url: bridgeUrl,
      name,
      classListArray: [],
    });
    const iframe = getIframeByName(name);
    iframe.style.display = "none";

    this.handshake = handshake;
  }

  // TODO: Should be generic query function?
  async identity() {
    return await this.handshake.then(child => {
      return child.get("identity");
    });
  }

  async isLoggedIn() {
    return await this.handshake.then(child => {
      return child.get("isLoggedIn");
    });
  }

  async login() {
    return await this.handshake.then(child => {
      return child.call("login");
    });
  }

  async logout() {
    return await this.handshake.then(child => {
      return child.call("logout");
    });
  }
}
