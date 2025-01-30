const mockUseAccount = jest.fn(() => ({
  account: { address: "0x123" },
  address: "0x123",
  status: "connected",
  isConnected: true,
  isDisconnected: false,
  isConnecting: false,
  isReconnecting: false,
}));

const mockUseConnectors = jest.fn(() => ({
  connectors: [],
  connect: jest.fn(),
  disconnect: jest.fn(),
}));

const mockUseContract = jest.fn(() => ({
  contract: null,
  data: null,
  error: null,
  isError: false,
  isLoading: false,
  isSuccess: false,
}));

const mockUseStarknet = jest.fn(() => ({
  account: null,
  chain: { id: "SN_GOERLI" },
  provider: null,
  isConnected: false,
  setConnector: jest.fn(),
}));

export {
  mockUseAccount as useAccount,
  mockUseConnectors as useConnectors,
  mockUseContract as useContract,
  mockUseStarknet as useStarknet,
}; 