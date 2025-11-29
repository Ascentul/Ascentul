// Mock for convex/browser used in API route tests
const ConvexHttpClient = jest.fn(() => {
  // If a mockReturnValue was provided by the test, reuse it
  const injected = ConvexHttpClient.mock?.results?.at(-1)?.value
  if (injected) return injected

  return {
    query: jest.fn().mockResolvedValue([]),
    mutation: jest.fn().mockResolvedValue({}),
    action: jest.fn(),
  }
})

module.exports = {
  ConvexHttpClient,
}
