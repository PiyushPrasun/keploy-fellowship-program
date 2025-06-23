const inMemoryDb = require("../../src/config/inMemoryDb");

describe("In-Memory Database", () => {
  // Save original vendors to restore after tests
  const originalVendors = [...inMemoryDb.vendors];

  // Restore original state after each test
  afterEach(() => {
    inMemoryDb.vendors = [...originalVendors];
  });

  test("should get next ID correctly", () => {
    // Should be max ID + 1
    const maxId = Math.max(...inMemoryDb.vendors.map((v) => v.id));
    expect(inMemoryDb.getNextId()).toBe(maxId + 1);

    // Test with empty array
    const originalVendors = [...inMemoryDb.vendors];
    inMemoryDb.vendors = [];
    expect(inMemoryDb.getNextId()).toBe(1);
    inMemoryDb.vendors = originalVendors;
  });

  test("should get all vendors", () => {
    const vendors = inMemoryDb.getAllVendors();
    expect(vendors).toEqual(inMemoryDb.vendors);
    expect(vendors).not.toBe(inMemoryDb.vendors); // Should be a new array (copy)
  });

  test("should get vendor by ID", () => {
    const existingVendor = inMemoryDb.vendors[0];
    const vendor = inMemoryDb.getVendorById(existingVendor.id);
    expect(vendor).toEqual(existingVendor);

    // Non-existent ID should return null
    expect(inMemoryDb.getVendorById(999)).toBeNull();
  });

  test("should add a new vendor", () => {
    const originalLength = inMemoryDb.vendors.length;
    const newVendorData = {
      name: "Test Vendor",
      category: "Testing",
      contact_email: "test@example.com",
    };

    const newVendor = inMemoryDb.addVendor(newVendorData);

    // Verify the vendor was added
    expect(inMemoryDb.vendors.length).toBe(originalLength + 1);
    expect(newVendor.id).toBe(inMemoryDb.getNextId() - 1);
    expect(newVendor.name).toBe(newVendorData.name);
    expect(newVendor.created_at).toBeDefined();
  });

  test("should update a vendor", () => {
    const existingVendor = inMemoryDb.vendors[0];
    const updateData = {
      name: "Updated Name",
      category: "Updated Category",
    };

    const updatedVendor = inMemoryDb.updateVendor(
      existingVendor.id,
      updateData
    );

    // Verify the vendor was updated
    expect(updatedVendor.id).toBe(existingVendor.id);
    expect(updatedVendor.name).toBe(updateData.name);
    expect(updatedVendor.category).toBe(updateData.category);

    // Verify other fields are preserved
    expect(updatedVendor.created_at).toBe(existingVendor.created_at);

    // Non-existent ID should return null
    expect(inMemoryDb.updateVendor(999, updateData)).toBeNull();
  });

  test("should delete a vendor", () => {
    const existingVendor = inMemoryDb.vendors[0];
    const originalLength = inMemoryDb.vendors.length;

    const deletedVendor = inMemoryDb.deleteVendor(existingVendor.id);

    // Verify the vendor was deleted
    expect(inMemoryDb.vendors.length).toBe(originalLength - 1);
    expect(deletedVendor).toEqual(existingVendor);
    expect(inMemoryDb.getVendorById(existingVendor.id)).toBeNull();

    // Non-existent ID should return null
    expect(inMemoryDb.deleteVendor(999)).toBeNull();
  });
});
