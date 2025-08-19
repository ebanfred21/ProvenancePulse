import { describe, it, expect, beforeEach } from "vitest";

interface MockContract {
  admin: string;
  paused: boolean;
  metadataFrozen: boolean;
  lastTokenId: bigint;
  owners: Map<bigint, string>;
  approvals: Map<bigint, string>;
  metadata: Map<bigint, {
    ethicalCert: string;
    artisanDetails: string;
    sustainabilityMetrics: { carbonFootprint: bigint; waterUsage: bigint; recycledPercent: bigint };
    narrativeUri: string | null;
  }>;
  isAdmin(caller: string): boolean;
  setPaused(caller: string, pause: boolean): { value: boolean } | { error: number };
  freezeMetadata(caller: string): { value: boolean } | { error: number };
  mint(
    caller: string,
    recipient: string,
    ethicalCert: string,
    artisanDetails: string,
    carbonFootprint: bigint,
    waterUsage: bigint,
    recycledPercent: bigint,
    narrativeUri: string | null
  ): { value: bigint } | { error: number };
  transfer(caller: string, tokenId: bigint, recipient: string): { value: boolean } | { error: number };
  approve(caller: string, tokenId: bigint, spender: string): { value: boolean } | { error: number };
  revokeApproval(caller: string, tokenId: bigint): { value: boolean } | { error: number };
  updateNarrativeUri(caller: string, tokenId: bigint, newUri: string): { value: boolean } | { error: number };
  burn(caller: string, tokenId: bigint): { value: boolean } | { error: number };
  getLastTokenId(): { value: bigint };
  getTokenUri(tokenId: bigint): { value: string | null } | { error: number };
  getOwner(tokenId: bigint): { value: string | null };
  getMetadata(tokenId: bigint): { value: {
    ethicalCert: string;
    artisanDetails: string;
    sustainabilityMetrics: { carbonFootprint: bigint; waterUsage: bigint; recycledPercent: bigint };
    narrativeUri: string | null;
  } } | { error: number };
}

const mockContract: MockContract = {
  admin: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  paused: false,
  metadataFrozen: false,
  lastTokenId: 0n,
  owners: new Map<bigint, string>(),
  approvals: new Map<bigint, string>(),
  metadata: new Map<bigint, {
    ethicalCert: string;
    artisanDetails: string;
    sustainabilityMetrics: { carbonFootprint: bigint; waterUsage: bigint; recycledPercent: bigint };
    narrativeUri: string | null;
  }>(),
  isAdmin(caller: string) {
    return caller === this.admin;
  },
  setPaused(caller: string, pause: boolean) {
    if (!this.isAdmin(caller)) return { error: 100 };
    this.paused = pause;
    return { value: pause };
  },
  freezeMetadata(caller: string) {
    if (!this.isAdmin(caller)) return { error: 100 };
    if (this.metadataFrozen) return { error: 105 };
    this.metadataFrozen = true;
    return { value: true };
  },
  mint(
    caller: string,
    recipient: string,
    ethicalCert: string,
    artisanDetails: string,
    carbonFootprint: bigint,
    waterUsage: bigint,
    recycledPercent: bigint,
    narrativeUri: string | null
  ) {
    if (!this.isAdmin(caller)) return { error: 100 };
    if (this.paused) return { error: 103 };
    if (ethicalCert.length === 0 || artisanDetails.length === 0 || recycledPercent > 100n) return { error: 107 };
    const newId = this.lastTokenId + 1n;
    if (this.owners.has(newId)) return { error: 108 };
    this.owners.set(newId, recipient);
    this.metadata.set(newId, {
      ethicalCert,
      artisanDetails,
      sustainabilityMetrics: { carbonFootprint, waterUsage, recycledPercent },
      narrativeUri,
    });
    this.lastTokenId = newId;
    return { value: newId };
  },
  transfer(caller: string, tokenId: bigint, recipient: string) {
    if (this.paused) return { error: 103 };
    const owner = this.owners.get(tokenId);
    if (!owner) return { error: 102 };
    const approval = this.approvals.get(tokenId);
    if (caller !== owner && caller !== approval) return { error: 101 };
    this.owners.set(tokenId, recipient);
    this.approvals.delete(tokenId);
    return { value: true };
  },
  approve(caller: string, tokenId: bigint, spender: string) {
    if (this.paused) return { error: 103 };
    const owner = this.owners.get(tokenId);
    if (!owner) return { error: 102 };
    if (caller !== owner) return { error: 101 };
    this.approvals.set(tokenId, spender);
    return { value: true };
  },
  revokeApproval(caller: string, tokenId: bigint) {
    if (this.paused) return { error: 103 };
    const owner = this.owners.get(tokenId);
    if (!owner) return { error: 102 };
    if (caller !== owner) return { error: 101 };
    this.approvals.delete(tokenId);
    return { value: true };
  },
  updateNarrativeUri(caller: string, tokenId: bigint, newUri: string) {
    if (this.paused) return { error: 103 };
    if (this.metadataFrozen) return { error: 105 };
    const owner = this.owners.get(tokenId);
    if (!owner) return { error: 102 };
    if (caller !== owner && !this.isAdmin(caller)) return { error: 100 };
    const meta = this.metadata.get(tokenId);
    if (!meta) return { error: 102 };
    this.metadata.set(tokenId, { ...meta, narrativeUri: newUri });
    return { value: true };
  },
  burn(caller: string, tokenId: bigint) {
    if (this.paused) return { error: 103 };
    const owner = this.owners.get(tokenId);
    if (!owner) return { error: 102 };
    if (caller !== owner) return { error: 101 };
    this.owners.delete(tokenId);
    this.metadata.delete(tokenId);
    this.approvals.delete(tokenId);
    return { value: true };
  },
  getLastTokenId() {
    return { value: this.lastTokenId };
  },
  getTokenUri(tokenId: bigint) {
    const meta = this.metadata.get(tokenId);
    if (!meta) return { error: 102 };
    return { value: meta.narrativeUri };
  },
  getOwner(tokenId: bigint) {
    return { value: this.owners.get(tokenId) ?? null };
  },
  getMetadata(tokenId: bigint) {
    const meta = this.metadata.get(tokenId);
    if (!meta) return { error: 102 };
    return { value: meta };
  },
};

describe("ProvenancePulse Ethical NFT Contract", () => {
  beforeEach(() => {
    mockContract.admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    mockContract.paused = false;
    mockContract.metadataFrozen = false;
    mockContract.lastTokenId = 0n;
    mockContract.owners = new Map();
    mockContract.approvals = new Map();
    mockContract.metadata = new Map();
  });

  it("should mint a new NFT when called by admin", () => {
    const result = mockContract.mint(
      mockContract.admin,
      "ST2CY5V39NHDP5P0GV2K35DNPGFZNWKRAKGVEJJ3Q",
      "Fair Trade",
      "Artisan John from Kenya",
      50n,
      100n,
      80n,
      "https://example.com/story1"
    );
    expect(result).toEqual({ value: 1n });
    expect(mockContract.owners.get(1n)).toBe("ST2CY5V39NHDP5P0GV2K35DNPGFZNWKRAKGVEJJ3Q");
    const meta = mockContract.metadata.get(1n);
    expect(meta?.ethicalCert).toBe("Fair Trade");
    expect(meta?.narrativeUri).toBe("https://example.com/story1");
  });

  it("should prevent minting with invalid metadata", () => {
    const result = mockContract.mint(
      mockContract.admin,
      "ST2CY5V39NHDP5P0GV2K35DNPGFZNWKRAKGVEJJ3Q",
      "",
      "Artisan",
      50n,
      100n,
      80n,
      null
    );
    expect(result).toEqual({ error: 107 });
  });

  it("should transfer NFT from owner", () => {
    mockContract.mint(
      mockContract.admin,
      "ST2CY5V39NHDP5P0GV2K35DNPGFZNWKRAKGVEJJ3Q",
      "Fair Trade",
      "Artisan",
      50n,
      100n,
      80n,
      null
    );
    const result = mockContract.transfer(
      "ST2CY5V39NHDP5P0GV2K35DNPGFZNWKRAKGVEJJ3Q",
      1n,
      "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP"
    );
    expect(result).toEqual({ value: true });
    expect(mockContract.owners.get(1n)).toBe("ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP");
  });

  it("should allow approved transfer", () => {
    mockContract.mint(
      mockContract.admin,
      "ST2CY5V39NHDP5P0GV2K35DNPGFZNWKRAKGVEJJ3Q",
      "Fair Trade",
      "Artisan",
      50n,
      100n,
      80n,
      null
    );
    mockContract.approve(
      "ST2CY5V39NHDP5P0GV2K35DNPGFZNWKRAKGVEJJ3Q",
      1n,
      "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP"
    );
    const result = mockContract.transfer(
      "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP",
      1n,
      "ST4VQFQWCKY8HGNJQAVB75N3340PKCVXVJ7HPGJT"
    );
    expect(result).toEqual({ value: true });
    expect(mockContract.owners.get(1n)).toBe("ST4VQFQWCKY8HGNJQAVB75N3340PKCVXVJ7HPGJT");
    expect(mockContract.approvals.has(1n)).toBe(false);
  });

  it("should update narrative URI by owner", () => {
    mockContract.mint(
      mockContract.admin,
      "ST2CY5V39NHDP5P0GV2K35DNPGFZNWKRAKGVEJJ3Q",
      "Fair Trade",
      "Artisan",
      50n,
      100n,
      80n,
      null
    );
    const result = mockContract.updateNarrativeUri(
      "ST2CY5V39NHDP5P0GV2K35DNPGFZNWKRAKGVEJJ3Q",
      1n,
      "https://new-story.com"
    );
    expect(result).toEqual({ value: true });
    expect(mockContract.metadata.get(1n)?.narrativeUri).toBe("https://new-story.com");
  });

  it("should prevent metadata update when frozen", () => {
    mockContract.mint(
      mockContract.admin,
      "ST2CY5V39NHDP5P0GV2K35DNPGFZNWKRAKGVEJJ3Q",
      "Fair Trade",
      "Artisan",
      50n,
      100n,
      80n,
      null
    );
    mockContract.freezeMetadata(mockContract.admin);
    const result = mockContract.updateNarrativeUri(
      "ST2CY5V39NHDP5P0GV2K35DNPGFZNWKRAKGVEJJ3Q",
      1n,
      "https://new.com"
    );
    expect(result).toEqual({ error: 105 });
  });

  it("should burn NFT by owner", () => {
    mockContract.mint(
      mockContract.admin,
      "ST2CY5V39NHDP5P0GV2K35DNPGFZNWKRAKGVEJJ3Q",
      "Fair Trade",
      "Artisan",
      50n,
      100n,
      80n,
      null
    );
    const result = mockContract.burn("ST2CY5V39NHDP5P0GV2K35DNPGFZNWKRAKGVEJJ3Q", 1n);
    expect(result).toEqual({ value: true });
    expect(mockContract.owners.has(1n)).toBe(false);
    expect(mockContract.metadata.has(1n)).toBe(false);
  });

  it("should not allow actions when paused", () => {
    mockContract.setPaused(mockContract.admin, true);
    const mintResult = mockContract.mint(
      mockContract.admin,
      "ST2CY5V39NHDP5P0GV2K35DNPGFZNWKRAKGVEJJ3Q",
      "Fair Trade",
      "Artisan",
      50n,
      100n,
      80n,
      null
    );
    expect(mintResult).toEqual({ error: 103 });
  });
});