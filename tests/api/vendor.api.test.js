const request = require("supertest");
const app = require("../../src/server");

// Mock the in-memory database
jest.mock("../../src/config/inMemoryDb", () =>
  require("../mocks/mockInMemoryDb")
);

// Import the mocked module for test control
const mockInMemoryDb = require("../mocks/mockInMemoryDb");

describe("Vendor API End-to-End Tests", () => {
  // Reset mock database before all tests
  beforeAll(() => {
    mockInMemoryDb.reset();
  });

  // Test full vendor lifecycle
  describe("Vendor CRUD Lifecycle", () => {
    let createdVendorId;
    let authToken;

    // Create auth token for multi-tenancy tests
    beforeAll(() => {
      authToken = require("jsonwebtoken").sign(
        { user: { id: 1, org_id: 1 } },
        process.env.JWT_SECRET || "test-secret-key"
      );
    });

    test("1. Should create a new vendor", async () => {
      const vendorData = {
        name: "E2E Test Vendor",
        category: "E2E Testing",
        contact_email: "e2e@example.com",
        phone_number: "555-E2E-TEST",
        address: "123 E2E Street, Test City",
      };

      const response = await request(app)
        .post("/api/vendors")
        .set("Authorization", `Bearer ${authToken}`)
        .send(vendorData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("E2E Test Vendor");
      expect(response.body.data).toHaveProperty("id");

      // Store the created vendor ID for subsequent tests
      createdVendorId = response.body.data.id;
    });

    test("2. Should retrieve the created vendor", async () => {
      const response = await request(app)
        .get(`/api/vendors/${createdVendorId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("E2E Test Vendor");
      expect(response.body.data.category).toBe("E2E Testing");
      expect(response.body.data.id).toBe(createdVendorId);
    });

    test("3. Should list all vendors including the created one", async () => {
      const response = await request(app)
        .get("/api/vendors")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.some((vendor) => vendor.id === createdVendorId)
      ).toBe(true);
    });

    test("4. Should update the created vendor", async () => {
      const updateData = {
        name: "Updated E2E Vendor",
        category: "Updated E2E Category",
        contact_email: "updated-e2e@example.com",
      };

      const response = await request(app)
        .put(`/api/vendors/${createdVendorId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated E2E Vendor");
      expect(response.body.data.category).toBe("Updated E2E Category");
      expect(response.body.data.contact_email).toBe("updated-e2e@example.com");
      expect(response.body.data.id).toBe(createdVendorId);

      // Verify the update is persistent
      const checkResponse = await request(app)
        .get(`/api/vendors/${createdVendorId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(checkResponse.body.data.name).toBe("Updated E2E Vendor");
    });

    test("5. Should delete the created vendor", async () => {
      const response = await request(app)
        .delete(`/api/vendors/${createdVendorId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("deleted successfully");

      // Verify it's actually deleted
      const checkResponse = await request(app)
        .get(`/api/vendors/${createdVendorId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(checkResponse.statusCode).toBe(404);
    });
  });

  // Test error handling
  describe("Error Handling", () => {
    test("Should return 400 for invalid vendor creation", async () => {
      const invalidVendor = {
        name: "Missing Category Vendor",
        // Missing required category field
      };

      const response = await request(app)
        .post("/api/vendors")
        .send(invalidVendor);

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("name and category");
    });

    test("Should return 404 for non-existent vendor", async () => {
      const response = await request(app).get("/api/vendors/9999");

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");
    });
  });

  // Test multi-tenancy
  describe("Multi-tenancy", () => {
    let user1Token, user2Token;
    let user1VendorId, user2VendorId;

    beforeAll(() => {
      // Create tokens for two different users
      user1Token = require("jsonwebtoken").sign(
        { user: { id: 1, org_id: 1 } },
        process.env.JWT_SECRET || "test-secret-key"
      );

      user2Token = require("jsonwebtoken").sign(
        { user: { id: 2, org_id: 2 } },
        process.env.JWT_SECRET || "test-secret-key"
      );
    });

    test("1. User 1 should create a vendor", async () => {
      const vendorData = {
        name: "User 1 Vendor",
        category: "User 1 Category",
      };

      const response = await request(app)
        .post("/api/vendors")
        .set("Authorization", `Bearer ${user1Token}`)
        .send(vendorData);

      expect(response.statusCode).toBe(201);
      user1VendorId = response.body.data.id;
      expect(response.body.data.user_id).toBe(1);
      expect(response.body.data.org_id).toBe(1);
    });

    test("2. User 2 should create a vendor", async () => {
      const vendorData = {
        name: "User 2 Vendor",
        category: "User 2 Category",
      };

      const response = await request(app)
        .post("/api/vendors")
        .set("Authorization", `Bearer ${user2Token}`)
        .send(vendorData);

      expect(response.statusCode).toBe(201);
      user2VendorId = response.body.data.id;
      expect(response.body.data.user_id).toBe(2);
      expect(response.body.data.org_id).toBe(2);
    });

    test("3. User 1 should not see User 2's vendors", async () => {
      const response = await request(app)
        .get("/api/vendors")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(response.statusCode).toBe(200);
      const vendorIds = response.body.data.map((vendor) => vendor.id);
      expect(vendorIds).toContain(user1VendorId);
      expect(vendorIds).not.toContain(user2VendorId);
    });

    test("4. User 1 should not be able to access User 2's vendor", async () => {
      const response = await request(app)
        .get(`/api/vendors/${user2VendorId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(response.statusCode).toBe(404);
    });

    test("5. User 1 should not be able to update User 2's vendor", async () => {
      const response = await request(app)
        .put(`/api/vendors/${user2VendorId}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({ name: "Unauthorized Update" });

      expect(response.statusCode).toBe(404);
    });

    test("6. User 1 should not be able to delete User 2's vendor", async () => {
      const response = await request(app)
        .delete(`/api/vendors/${user2VendorId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(response.statusCode).toBe(404);

      // Verify User 2's vendor still exists
      const checkResponse = await request(app)
        .get(`/api/vendors/${user2VendorId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(checkResponse.statusCode).toBe(200);
    });
  });
});
