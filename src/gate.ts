import { connectToChild } from "penpal";
import { Connection } from "penpal/lib/types";

import { createIframe } from "./utils";

type Interface = Record<string, Array<string>>;

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
  bridgeUrl: string;
  providerInfo!: ProviderInfo;

  bridgeConnection!: Connection;

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
    return this.bridgeConnection.promise
      .then(async (child) => child.connectProvider(skappInfo))
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
  }

  async destroyBridge(): Promise<void> {
    // TODO: Close the child iframe?
    if (this.providerInfo.isProviderLoaded) {
      await this.unloadProvider();
    }
    this.providerInfo = emptyProviderInfo;
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

  async getProviderInfo(): Promise<ProviderInfo> {
    return this.bridgeConnection.promise
      .then(async (child) => child.getProviderInfo())
      .then((info: ProviderInfo) => {
        this.providerInfo = info;
        return info;
      });
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

  async unloadProvider(): Promise<void> {
    return this.bridgeConnection.promise.then(async (child) => child.unloadProvider());
  }

  // =====================
  // Internal Gate Methods
  // =====================

  start(): void {
    // Initialize state.
    this.providerInfo = emptyProviderInfo;

    // Create the iframe.
    const childFrame = createIframe(this.bridgeUrl);

    // Connect to the iframe.
    const connection = connectToChild({
      iframe: childFrame,
      timeout: 5_000,
    });

    this.bridgeConnection = connection;
  }
}
