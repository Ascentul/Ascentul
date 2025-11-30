const useToast = jest.fn()
// Default return to satisfy components
useToast.mockReturnValue({ toast: jest.fn() })

module.exports = {
  __esModule: true,
  useToast,
}
