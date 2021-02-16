import { ParentHandshake, WindowMessenger } from "post-me";
import type { Connection } from "post-me";

import { createIframe } from "./utils";

type Interface = Record<string, Array<string>>;

type BridgeInfo = {
  minimumInterface: Interface;
  relativeRouterUrl: string;
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

  // ===========
  // Constructor
  // ===========

  constructor(bridgeUrl: string) {
    if (typeof Storage == "undefined") {
      throw new Error("Browser does not support web storage");
    }

    this.bridgeUrl = bridgeUrl;
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

  protected start(): void {
    // Initialize state.
    this.providerInfo = emptyProviderInfo;

    // Create the iframe.
    this.childFrame = createIframe(this.bridgeUrl)
    const childWindow = this.childFrame.contentWindow!;

    // Connect to the iframe.
    const messenger = new WindowMessenger({
      localWindow: window,
      remoteWindow: childWindow,
      remoteOrigin: "*",
    });
    this.bridgeConnection = ParentHandshake(messenger);

    this.bridgeInfo = this.getBridgeInfo();
  }
}
