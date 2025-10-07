// Mock for convex/browser
module.exports = {
  ConvexHttpClient: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    mutation: jest.fn(),
    action: jest.fn(),
  })),
};
