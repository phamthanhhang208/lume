export const scanKeys = {
  all: ["scans"] as const,
  latest: () => ["scans", "latest"] as const,
};
