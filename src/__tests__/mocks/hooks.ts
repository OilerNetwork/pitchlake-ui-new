// Mock core hooks
export const useContractWrite = jest.fn().mockReturnValue({
  writeAsync: jest.fn().mockResolvedValue({}),
  isLoading: false,
  error: null,
});

export const useExplorer = jest.fn().mockReturnValue({
  getExplorerUrl: jest.fn().mockReturnValue("https://mock-explorer.com"),
  getAddressUrl: jest.fn().mockReturnValue("https://mock-explorer.com/address/0x123"),
  getTransactionUrl: jest.fn().mockReturnValue("https://mock-explorer.com/tx/0x123"),
});

// Add test to satisfy jest requirement
describe('hooks', () => {
  it('exports mock hooks', () => {
    expect(useContractWrite).toBeDefined();
    expect(useExplorer).toBeDefined();
  });
}); 