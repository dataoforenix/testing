export type SandboxBank = {
  id: string;
  name: string;
  shortName: string;
  accent: string;
  initials: string;
  featured?: boolean;
};

/**
 * Sandbox ASPSPs for Open Banking simulation.
 * Featured banks match the project brief (Housing Bank, Capital Bank, JKB).
 * Not live bank APIs — ProviderEscrowPort swaps in production connectors.
 */
export const SANDBOX_BANKS: SandboxBank[] = [
  {
    id: "housing-bank",
    name: "Housing Bank for Trade & Finance",
    shortName: "Housing Bank",
    accent: "#0E6655",
    initials: "HB",
    featured: true,
  },
  {
    id: "capital-bank",
    name: "Capital Bank of Jordan",
    shortName: "Capital Bank",
    accent: "#1B3A5F",
    initials: "CB",
    featured: true,
  },
  {
    id: "jordan-kuwait",
    name: "Jordan Kuwait Bank",
    shortName: "JKB",
    accent: "#1A5276",
    initials: "JK",
    featured: true,
  },
  {
    id: "arab-bank",
    name: "Arab Bank",
    shortName: "Arab Bank",
    accent: "#1B4F72",
    initials: "AB",
  },
  {
    id: "bank-al-etihad",
    name: "Bank al Etihad",
    shortName: "al Etihad",
    accent: "#6C3483",
    initials: "BE",
  },
  {
    id: "cairo-amman",
    name: "Cairo Amman Bank",
    shortName: "CAB",
    accent: "#922B21",
    initials: "CA",
  },
];

export function getSandboxBank(id: string | null | undefined): SandboxBank | undefined {
  if (!id) return undefined;
  return SANDBOX_BANKS.find((b) => b.id === id);
}

export function featuredBanks(): SandboxBank[] {
  return SANDBOX_BANKS.filter((b) => b.featured);
}
