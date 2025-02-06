export const useContractRead = jest.fn(() => ({
  data: null,
  isLoading: false,
  isError: false,
}));

export const useContract = jest.fn(() => ({
  contract: null,
}));

export const useProvider = jest.fn(() => ({
  provider: null,
}));

export const useAccount = jest.fn(() => ({
  address: null,
  status: "disconnected",
}));

export const useExplorer = jest.fn(() => ({
  getTransactionLink: jest.fn(),
}));

export const useContractWrite = jest.fn(() => ({
  writeAsync: jest.fn(),
  data: null,
  isLoading: false,
  isError: false,
})); 