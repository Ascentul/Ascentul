import { z } from 'zod'

export type PasswordStrength = 0 | 1 | 2 | 3 | 4 | 5

const passwordSchema = z.string()

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  const validated = passwordSchema.parse(password)

  let strength: PasswordStrength = 0
  if (validated.length >= 8) strength += 1
  if (/[a-z]/.test(validated)) strength += 1
  if (/[A-Z]/.test(validated)) strength += 1
  if (/[0-9]/.test(validated)) strength += 1
  if (/[^a-zA-Z0-9]/.test(validated)) strength += 1
  return strength as PasswordStrength
}

export const getPasswordStrengthColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case 0:
    case 1:
      return 'bg-red-500'
    case 2:
      return 'bg-orange-500'
    case 3:
      return 'bg-yellow-500'
    case 4:
      return 'bg-blue-500'
    case 5:
      return 'bg-green-500'
    default:
      return 'bg-gray-300'
  }
}

export const getPasswordStrengthText = (strength: PasswordStrength): string => {
  switch (strength) {
    case 0:
    case 1:
      return 'Very weak'
    case 2:
      return 'Weak'
    case 3:
      return 'Fair'
    case 4:
      return 'Good'
    case 5:
      return 'Strong'
    default:
      return 'Unknown'
  }
}

export const getPasswordStrengthTextColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case 0:
    case 1:
      return 'text-red-600'
    case 2:
      return 'text-orange-600'
    case 3:
      return 'text-yellow-600'
    case 4:
      return 'text-blue-600'
    case 5:
      return 'text-green-600'
    default:
      return 'text-gray-600'
  }
}
