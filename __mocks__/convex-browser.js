// Mock for convex/browser used in API route tests
const createMockClient = () => ({
  query: jest.fn().mockResolvedValue([]),
  mutation: jest.fn().mockResolvedValue({}),
  action: jest.fn(),
})

const ConvexHttpClient = jest.fn(() => {
  return createMockClient()
})

module.exports = {
  ConvexHttpClient,
}
