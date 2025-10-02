import { convexTest } from "convex-test"
import { expect, test, describe } from "vitest"
import schema from "./schema"
import { api } from "./_generated/api"

describe("platform_settings", () => {
  describe("updatePlatformSettings", () => {
    test("should persist settings to database", async () => {
      const t = convexTest(schema)

      // Create admin user
      await t.mutation(api.users.createUser, {
        clerkId: "admin-clerk-id",
        email: "admin@example.com",
        name: "Admin User",
        role: "super_admin",
      })

      // Update platform settings
      const result = await t.mutation(api.platform_settings.updatePlatformSettings, {
        clerkId: "admin-clerk-id",
        settings: {
          openai_model: "gpt-4o",
          openai_temperature: 0.8,
          openai_max_tokens: 5000,
          maintenance_mode: true,
          allow_signups: false,
        },
      })

      expect(result.success).toBe(true)
      expect(result.settings.openai_model).toBe("gpt-4o")
      expect(result.settings.openai_temperature).toBe(0.8)
      expect(result.settings.openai_max_tokens).toBe(5000)
      expect(result.settings.maintenance_mode).toBe(true)
      expect(result.settings.allow_signups).toBe(false)

      // Query settings to verify persistence
      const settings = await t.query(api.platform_settings.getPlatformSettings, {})
      expect(settings.openai_model).toBe("gpt-4o")
      expect(settings.openai_temperature).toBe(0.8)
      expect(settings.maintenance_mode).toBe(true)
    })

    test("should update existing settings", async () => {
      const t = convexTest(schema)

      await t.mutation(api.users.createUser, {
        clerkId: "admin-2",
        email: "admin2@example.com",
        name: "Admin 2",
        role: "admin",
      })

      // First update
      await t.mutation(api.platform_settings.updatePlatformSettings, {
        clerkId: "admin-2",
        settings: {
          openai_model: "gpt-4o-mini",
        },
      })

      // Second update to same setting
      await t.mutation(api.platform_settings.updatePlatformSettings, {
        clerkId: "admin-2",
        settings: {
          openai_model: "gpt-4-turbo",
        },
      })

      const settings = await t.query(api.platform_settings.getPlatformSettings, {})
      expect(settings.openai_model).toBe("gpt-4-turbo")
    })

    test("should reject non-admin users", async () => {
      const t = convexTest(schema)

      await t.mutation(api.users.createUser, {
        clerkId: "regular-user",
        email: "user@example.com",
        name: "Regular User",
        role: "user",
      })

      await expect(
        t.mutation(api.platform_settings.updatePlatformSettings, {
          clerkId: "regular-user",
          settings: {
            openai_model: "gpt-4o",
          },
        })
      ).rejects.toThrow("Unauthorized - Admin access required")
    })

    test("should return default values for unset settings", async () => {
      const t = convexTest(schema)

      const settings = await t.query(api.platform_settings.getPlatformSettings, {})

      // Should return defaults
      expect(settings.openai_model).toBeDefined()
      expect(settings.openai_temperature).toBe(0.7)
      expect(settings.maintenance_mode).toBe(false)
    })
  })

  describe("getPlatformSettings", () => {
    test("should retrieve all platform settings", async () => {
      const t = convexTest(schema)

      const settings = await t.query(api.platform_settings.getPlatformSettings, {})

      expect(settings).toHaveProperty("openai_model")
      expect(settings).toHaveProperty("openai_temperature")
      expect(settings).toHaveProperty("openai_max_tokens")
      expect(settings).toHaveProperty("maintenance_mode")
      expect(settings).toHaveProperty("allow_signups")
      expect(settings).toHaveProperty("default_user_role")
    })
  })

  describe("getAvailableOpenAIModels", () => {
    test("should return list of available models", async () => {
      const t = convexTest(schema)

      const models = await t.query(api.platform_settings.getAvailableOpenAIModels, {})

      expect(Array.isArray(models)).toBe(true)
      expect(models.length).toBeGreaterThan(0)
      expect(models[0]).toHaveProperty("id")
      expect(models[0]).toHaveProperty("name")
      expect(models[0]).toHaveProperty("description")
    })
  })
})
