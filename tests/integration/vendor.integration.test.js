const request = require("supertest");
const app = require("../../src/server");
const Vendor = require("../../src/models/vendor");

// Mock the in-memory database
jest.mock("../../src/config/inMemoryDb", () =>
  require("../mocks/mockInMemoryDb")
);

// Import the mocked module for test control
const mockInMemoryDb = require("../mocks/mockInMemoryDb");

let server;

describe("Vendor API Integration Tests", () => {
  // Setup server before all tests
  beforeAll((done) => {
    server = app.listen(0, done); // Use port 0 for random available port
  });

  // Clean up server after all tests
  afterAll((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  // Reset mock database before each test
  beforeEach(() => {
    mockInMemoryDb.reset();
  });

  describe("GET /api/vendors", () => {
    test("should return all vendors", async () => {
      const response = await request(app).get("/api/vendors");

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(3);
      expect(response.body.data).toHaveLength(3);
      // Vendors are sorted by created_at in descending order
      expect(response.body.data[0].name).toBe("Other User Vendor");
    });

    test("should return user-specific vendors when authenticated", async () => {
      // Create a JWT token for user with id=1, org_id=1
      const token = require("jsonwebtoken").sign(
        { user: { id: 1, org_id: 1 } },
        process.env.JWT_SECRET || "test-secret-key"
      );

      const response = await request(app)
        .get("/api/vendors")
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2); // Only user_id=1 vendors
      expect(response.body.data.every((vendor) => vendor.user_id === 1)).toBe(
        true
      );
    });
  });

  describe("GET /api/vendors/:id", () => {
    test("should return a vendor by id", async () => {
      const response = await request(app).get("/api/vendors/1");

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.name).toBe("Test Vendor 1");
    });

    test("should return 404 for non-existent vendor", async () => {
      const response = await request(app).get("/api/vendors/999");

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Vendor not found");
    });

    test("should not return vendor from another user when authenticated", async () => {
      const token = require("jsonwebtoken").sign(
        { user: { id: 1, org_id: 1 } },
        process.env.JWT_SECRET || "test-secret-key"
      );

      const response = await request(app)
        .get("/api/vendors/3") // Vendor owned by user_id 2
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/vendors", () => {
    test("should create a new vendor", async () => {
      const vendorData = {
        name: "Integration Test Vendor",
        category: "Integration Category",
        contact_email: "integration@example.com",
        phone_number: "111-222-3333",
        address: "123 Integration St",
      };

      const response = await request(app).post("/api/vendors").send(vendorData);

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Integration Test Vendor");
      expect(response.body.data.category).toBe("Integration Category");
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("created_at");
    });

    test("should associate vendor with user when authenticated", async () => {
      const token = require("jsonwebtoken").sign(
        { user: { id: 1, org_id: 1 } },
        process.env.JWT_SECRET || "test-secret-key"
      );

      const vendorData = {
        name: "Auth Test Vendor",
        category: "Auth Category",
      };

      const response = await request(app)
        .post("/api/vendors")
        .set("Authorization", `Bearer ${token}`)
        .send(vendorData);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.user_id).toBe(1);
      expect(response.body.data.org_id).toBe(1);
    });

    test("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/api/vendors")
        .send({ name: "Incomplete Vendor" }); // Missing category

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("name and category");
    });
  });

  describe("PUT /api/vendors/:id", () => {
    test("should update an existing vendor", async () => {
      const updateData = {
        name: "Updated Integration Vendor",
        category: "Updated Category",
      };

      const response = await request(app)
        .put("/api/vendors/1")
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated Integration Vendor");
      expect(response.body.data.category).toBe("Updated Category");
      expect(response.body.data.id).toBe(1);
    });

    test("should return 404 for non-existent vendor", async () => {
      const response = await request(app)
        .put("/api/vendors/999")
        .send({ name: "Not Found Vendor" });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test("should prevent updating vendor from another user when authenticated", async () => {
      const token = require("jsonwebtoken").sign(
        { user: { id: 1, org_id: 1 } },
        process.env.JWT_SECRET || "test-secret-key"
      );

      const response = await request(app)
        .put("/api/vendors/3") // Vendor owned by user_id 2
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Unauthorized Update" });

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/vendors/:id", () => {
    test("should delete an existing vendor", async () => {
      const response = await request(app).delete("/api/vendors/1");

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("deleted successfully");

      // Verify it's actually deleted
      const checkResponse = await request(app).get("/api/vendors/1");
      expect(checkResponse.statusCode).toBe(404);
    });

    test("should return 404 for non-existent vendor", async () => {
      const response = await request(app).delete("/api/vendors/999");

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test("should prevent deleting vendor from another user when authenticated", async () => {
      const token = require("jsonwebtoken").sign(
        { user: { id: 1, org_id: 1 } },
        process.env.JWT_SECRET || "test-secret-key"
      );

      const response = await request(app)
        .delete("/api/vendors/3") // Vendor owned by user_id 2
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
