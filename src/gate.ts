import { connectToChild } from "penpal";
import { Connection } from "penpal/lib/types";

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
  bridgeConnection!: Connection;
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

    return this.bridgeConnection.promise.then(async (child) => child.callInterface(method));
  }

  // TODO: Verify return value from child has correct fields.
  async connectProvider(skappInfo: SkappInfo): Promise<ProviderInfo> {
    const child = await this.bridgeConnection.promise;
    const info = await child.connectProvider(skappInfo);

    this.providerInfo = info;
    return info;
  }

  async destroyBridge(): Promise<void> {
    if (this.providerInfo.isProviderLoaded) {
      try {
        await this.unloadProvider();
      } catch (error) {
        console.log(error);
      }
    }

    this.providerInfo = emptyProviderInfo;

    // Close the child iframe.
    if (this.childFrame) {
      this.childFrame.parentNode!.removeChild(this.childFrame);
    }

    return this.bridgeConnection.destroy();
  }

  async disconnectProvider(): Promise<ProviderInfo> {
    return this.bridgeConnection.promise
      .then(async (child) => child.disconnectProvider())
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
  }

  async fetchStoredProvider(skappInfo: SkappInfo): Promise<ProviderInfo> {
    return this.bridgeConnection.promise
      .then(async (child) => child.fetchStoredProvider(skappInfo))
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
  }

  async getBridgeInfo(): Promise<BridgeInfo> {
    const child = await this.bridgeConnection.promise;
    const info = await child.getBridgeInfo();

    return info;
  }

  async getProviderInfo(): Promise<ProviderInfo> {
    const child = await this.bridgeConnection.promise;
    const info = await child.getProviderInfo();

    this.providerInfo = info;
    return info;
  }

  async loadNewProvider(skappInfo: SkappInfo): Promise<ProviderInfo> {
    return this.bridgeConnection.promise
      .then(async (child) => child.loadNewProvider(skappInfo))
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
  }

  async restartBridge(): Promise<void> {
    await this.destroyBridge();
    this.start();
  }

  async unloadProvider(): Promise<ProviderInfo> {
    const child = await this.bridgeConnection.promise;
    const info = await child.unloadProvider();

    this.providerInfo = info;
    return info;
  }

  // =====================
  // Internal Gate Methods
  // =====================

  start(): void {
    // Initialize state.
    this.providerInfo = emptyProviderInfo;

    // Create the iframe.
    this.childFrame = createIframe(this.bridgeUrl);

    // Connect to the iframe.
    this.bridgeConnection = connectToChild({
      iframe: this.childFrame,
      // TODO: Allow customizing the timeout
      timeout: 15_000,
    });

    this.bridgeInfo = this.getBridgeInfo();
  }
}
