const Vendor = require("../../src/models/vendor");

// Mock the in-memory database
jest.mock("../../src/config/inMemoryDb", () =>
  require("../mocks/mockInMemoryDb")
);

// Import the mocked module for test control
const mockInMemoryDb = require("../mocks/mockInMemoryDb");

describe("Vendor Model", () => {
  // Reset mock database before each test
  beforeEach(() => {
    mockInMemoryDb.reset();
  });

  describe("getAll", () => {
    test("should return all vendors when no filters are provided", async () => {
      const vendors = await Vendor.getAll();
      expect(vendors).toHaveLength(3);
      // Vendors are sorted by created_at in descending order (newest first)
      expect(vendors[0].name).toBe("Other User Vendor"); // created_at: 2025-06-21T13:00:00Z
      expect(vendors[1].name).toBe("Test Vendor 2"); // created_at: 2025-06-21T12:30:00Z
      expect(vendors[2].name).toBe("Test Vendor 1"); // created_at: 2025-06-21T12:00:00Z
    });
    test("should filter vendors by userId", async () => {
      const vendors = await Vendor.getAll(1);
      expect(vendors).toHaveLength(2);
      // Vendors are sorted by created_at in descending order
      expect(vendors[0].name).toBe("Test Vendor 2"); // created_at: 2025-06-21T12:30:00Z
      expect(vendors[1].name).toBe("Test Vendor 1"); // created_at: 2025-06-21T12:00:00Z
    });

    test("should filter vendors by orgId", async () => {
      const vendors = await Vendor.getAll(null, 2);
      expect(vendors).toHaveLength(1);
      expect(vendors[0].name).toBe("Other User Vendor");
    });

    test("should filter vendors by both userId and orgId", async () => {
      const vendors = await Vendor.getAll(1, 1);
      expect(vendors).toHaveLength(2);
      expect(vendors[0].user_id).toBe(1);
      expect(vendors[0].org_id).toBe(1);
    });

    test("should return empty array if no matching vendors", async () => {
      const vendors = await Vendor.getAll(999);
      expect(vendors).toHaveLength(0);
    });
  });

  describe("getById", () => {
    test("should return vendor by id", async () => {
      const vendor = await Vendor.getById(1);
      expect(vendor).not.toBeNull();
      expect(vendor.id).toBe(1);
      expect(vendor.name).toBe("Test Vendor 1");
    });

    test("should return null if vendor does not exist", async () => {
      const vendor = await Vendor.getById(999);
      expect(vendor).toBeNull();
    });

    test("should return null if vendor exists but does not belong to user", async () => {
      const vendor = await Vendor.getById(3, 1);
      expect(vendor).toBeNull();
    });

    test("should return null if vendor exists but does not belong to org", async () => {
      const vendor = await Vendor.getById(1, null, 2);
      expect(vendor).toBeNull();
    });
  });

  describe("create", () => {
    test("should create a new vendor", async () => {
      const newVendorData = {
        name: "New Test Vendor",
        category: "New Category",
        contact_email: "new@example.com",
        phone_number: "111-222-3333",
        address: "999 New St, New City",
        user_id: 1,
        org_id: 1,
      };

      const newVendor = await Vendor.create(newVendorData);

      expect(newVendor).toHaveProperty("id");
      expect(newVendor.name).toBe("New Test Vendor");
      expect(newVendor.category).toBe("New Category");
      expect(newVendor.user_id).toBe(1);

      // Check that vendor was actually added to the database
      const vendors = await Vendor.getAll();
      expect(vendors).toHaveLength(4);
    });

    test("should create vendor without user_id/org_id if not provided", async () => {
      const newVendorData = {
        name: "Public Vendor",
        category: "Public Category",
      };

      const newVendor = await Vendor.create(newVendorData);

      expect(newVendor).toHaveProperty("id");
      expect(newVendor.name).toBe("Public Vendor");
      expect(newVendor.user_id).toBeNull();
      expect(newVendor.org_id).toBeNull();
    });
  });

  describe("update", () => {
    test("should update existing vendor", async () => {
      const updateData = {
        name: "Updated Vendor",
        category: "Updated Category",
      };

      const updatedVendor = await Vendor.update(1, updateData, 1, 1);

      expect(updatedVendor.name).toBe("Updated Vendor");
      expect(updatedVendor.category).toBe("Updated Category");
      expect(updatedVendor.id).toBe(1);

      // Other fields should remain unchanged
      expect(updatedVendor.contact_email).toBe("test1@example.com");
    });

    test("should return null if vendor does not exist", async () => {
      const updateData = {
        name: "Updated Vendor",
      };

      const updatedVendor = await Vendor.update(999, updateData, 1, 1);
      expect(updatedVendor).toBeNull();
    });

    test("should return null if vendor does not belong to user", async () => {
      const updateData = {
        name: "Updated Vendor",
      };

      const updatedVendor = await Vendor.update(3, updateData, 1, 1);
      expect(updatedVendor).toBeNull();
    });
  });

  describe("delete", () => {
    test("should delete existing vendor", async () => {
      const result = await Vendor.delete(1, 1, 1);
      expect(result).not.toBeNull();

      // Verify vendor was deleted
      const vendor = await Vendor.getById(1);
      expect(vendor).toBeNull();

      // Verify other vendors still exist
      const vendors = await Vendor.getAll();
      expect(vendors).toHaveLength(2);
    });

    test("should return null if vendor does not exist", async () => {
      const result = await Vendor.delete(999, 1, 1);
      expect(result).toBeNull();
    });

    test("should return null if vendor does not belong to user", async () => {
      const result = await Vendor.delete(3, 1, 1);
      expect(result).toBeNull();
    });
  });
});
