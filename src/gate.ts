import { ParentHandshake, WindowMessenger } from "post-me";
import type { Connection } from "post-me";
import { SkynetClient } from "skynet-js";
import urljoin from "url-join";

import { createIframe, popupCenter } from "./utils";
import { handshakeAttemptsInterval, handshakeMaxAttempts } from "./consts";

type Interface = Record<string, Array<string>>;

type BridgeInfo = {
  minimumInterface: Interface;
  relativeRouterUrl: string;
  routerName: string;
  routerW: number;
  routerH: number;
}

export type ProviderInfo = {
  providerInterface: Interface | null;
  isProviderConnected: boolean;
  isProviderLoaded: boolean;
  metadata: ProviderMetadata | null;
};

const emptyProviderInfo = {
  providerInterface: null,
  isProviderConnected: false,
  isProviderLoaded: false,
  metadata: null,
};

type ProviderMetadata = {
  name: string;
  domain: string;
};

export class SkappInfo {
  name: string;
  domain: string;

  constructor(name: string) {
    this.name = name;
    this.domain = location.hostname;
  }
}

export class Gate {
  bridgeConnection!: Promise<Connection>;
  bridgeInfo!: Promise<BridgeInfo>;
  bridgeUrl: string;
  providerInfo!: ProviderInfo;

  protected childFrame?: HTMLIFrameElement;
  protected client!: SkynetClient;

  // ===========
  // Constructor
  // ===========

  constructor(client: SkynetClient, bridgeUrl: string) {
    if (typeof Storage == "undefined") {
      throw new Error("Browser does not support web storage");
    }

    this.bridgeUrl = bridgeUrl;
    this.client = client;

    this.start();
  }

  // ===============
  // Public Gate API
  // ===============

  async callInterface(method: string): Promise<unknown> {
    if (!this.providerInfo.isProviderConnected) {
      throw new Error("Provider not connected, cannot access interface");
    }
    if (!this.providerInfo.providerInterface) {
      throw new Error("Provider interface not present despite being connected. Possible logic bug");
    }

    // TODO: This check doesn't work.
    // if (method in this.providerInfo.providerInterface) {
    //   throw new Error(
    //     `Unsupported method for this provider interface. Method: '${method}', Interface: ${this.providerInfo.providerInterface}`
    //   );
    // }

    const connection = await this.bridgeConnection;
    return connection.remoteHandle().call("callInterface", method);
  }

  // TODO: Verify return value from child has correct fields.
  async connectProvider(skappInfo: SkappInfo): Promise<ProviderInfo> {
    const connection = await this.bridgeConnection;
    const info = await connection.remoteHandle().call("connectProvider", skappInfo);

    this.providerInfo = info;
    return info;
  }

  /**
   * Destroys the bridge by: 1. unloading the provider on the bridge, 2. closing the bridge connection, 3. closing the child iframe
   */
  async destroyBridge(): Promise<void> {
    if (this.providerInfo.isProviderLoaded) {
      try {
        await this.unloadProvider();
      } catch (error) {
        console.log(error);
      }
    }

    this.providerInfo = emptyProviderInfo;

    const connection = await this.bridgeConnection;
    connection.close();

    // Close the child iframe.
    if (this.childFrame) {
      this.childFrame.parentNode!.removeChild(this.childFrame);
    }
  }

  async disconnectProvider(): Promise<ProviderInfo> {
    const connection = await this.bridgeConnection;
    const info = await connection.remoteHandle().call("disconnectProvider");

    this.providerInfo = info;
    return info;
  }

  async fetchStoredProvider(skappInfo: SkappInfo): Promise<ProviderInfo> {
    const connection = await this.bridgeConnection;
    const info = await connection.remoteHandle().call("fetchStoredProvider", skappInfo);

    this.providerInfo = info;
    return info;
  }

  async getBridgeInfo(): Promise<BridgeInfo> {
    const connection = await this.bridgeConnection;
    const info = await connection.remoteHandle().call("getBridgeInfo");

    return info;
  }

  async getProviderInfo(): Promise<ProviderInfo> {
    const connection = await this.bridgeConnection;
    const info = await connection.remoteHandle().call("getProviderInfo");

    this.providerInfo = info;
    return info;
  }

  async loadNewProvider(skappInfo: SkappInfo): Promise<ProviderInfo> {
    const result = await this.launchRouter();
    if (result === "closed") {
      // User closed the router. Don't show error message screen, just silently return the current provider info without changes.
      return this.providerInfo;
    } else if (result !== "success") {
      throw new Error(result);
    }

    // TODO: Wait for bridge to receive provider URL?
    const connection = await this.bridgeConnection;
    const info = await connection.remoteHandle().call("loadNewProvider", skappInfo);

    this.providerInfo = info;
    return info;
  }

  /**
   * Restarts the bridge by destroying it and starting it again.
   */
  async restartBridge(): Promise<void> {
    await this.destroyBridge();
    this.start();
  }

  async unloadProvider(): Promise<ProviderInfo> {
    const connection = await this.bridgeConnection;
    const info = await connection.remoteHandle().call("unloadProvider");

    this.providerInfo = info;
    return info;
  }

  // =====================
  // Internal Gate Methods
  // =====================

  // TODO: should check periodically if window is still open.
  /**
   * Creates window with router and waits for a response.
   */
  protected async launchRouter(): Promise<string> {
    // Set the router URL.
    const bridgeInfo = await this.bridgeInfo;
    const relativeRouterUrl = bridgeInfo.relativeRouterUrl;
    const routerUrl = urljoin(this.bridgeUrl, relativeRouterUrl);

    // Open the router.
    const routerWindow = popupCenter(routerUrl, bridgeInfo.routerName, bridgeInfo.routerW, bridgeInfo.routerH);

    // Establish a connection with the router.
    const messenger = new WindowMessenger({
      localWindow: window,
      remoteWindow: routerWindow,
      remoteOrigin: "*",
    });
    const routerConnection = await ParentHandshake(messenger, {}, handshakeMaxAttempts, handshakeAttemptsInterval);
    const remoteHandle = routerConnection.remoteHandle();

    // Send the bridge iframe name to the router so it knows where to send the provider URL.
    if (!this.childFrame) {
      throw new Error("Bridge iframe not found");
    }
    remoteHandle.call("setFrameName", this.bridgeUrl);

    // Wait for result.
    const result: string = await new Promise((resolve) => {
      remoteHandle.addEventListener("result", (payload) => resolve(payload));
    });

    // Close the connection.
    routerConnection.close();

    return result;
  }

  protected start(): void {
    // Initialize state.
    this.providerInfo = emptyProviderInfo;

    // Create the iframe.
    this.childFrame = createIframe(this.bridgeUrl, this.bridgeUrl)
    const childWindow = this.childFrame.contentWindow!;

    // Connect to the iframe.
    const messenger = new WindowMessenger({
      localWindow: window,
      remoteWindow: childWindow,
      remoteOrigin: "*",
    });
    this.bridgeConnection = ParentHandshake(messenger, {}, handshakeMaxAttempts, handshakeAttemptsInterval);

    this.bridgeInfo = this.getBridgeInfo();
  }
}
