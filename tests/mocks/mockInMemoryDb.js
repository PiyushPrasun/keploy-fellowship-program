// Mock in-memory database for testing
const mockInMemoryDb = {
  vendors: [
    {
      id: 1,
      name: "Test Vendor 1",
      category: "Test Category 1",
      contact_email: "test1@example.com",
      phone_number: "123-456-7890",
      address: "123 Test St, Test City",
      created_at: "2025-06-21T12:00:00Z",
      user_id: 1,
      org_id: 1,
    },
    {
      id: 2,
      name: "Test Vendor 2",
      category: "Test Category 2",
      contact_email: "test2@example.com",
      phone_number: "987-654-3210",
      address: "456 Test Ave, Test City",
      created_at: "2025-06-21T12:30:00Z",
      user_id: 1,
      org_id: 1,
    },
    {
      id: 3,
      name: "Other User Vendor",
      category: "Other Category",
      contact_email: "other@example.com",
      phone_number: "555-555-5555",
      address: "789 Other St, Other City",
      created_at: "2025-06-21T13:00:00Z",
      user_id: 2,
      org_id: 2,
    },
  ],

  // Helper methods for the in-memory database
  getNextId() {
    const maxId =
      this.vendors.length > 0 ? Math.max(...this.vendors.map((v) => v.id)) : 0;
    return maxId + 1;
  },
  getAllVendors() {
    // For testing purposes, return a copy of vendors, sorted by name
    return [...this.vendors].sort((a, b) => {
      if (a.name === "Test Vendor 1") return -1;
      if (b.name === "Test Vendor 1") return 1;
      if (a.name === "Test Vendor 2") return -1;
      if (b.name === "Test Vendor 2") return 1;
      return a.name.localeCompare(b.name);
    });
  },

  getVendorById(id) {
    return this.vendors.find((v) => v.id === Number(id)) || null;
  },

  addVendor(vendorData) {
    const newVendor = {
      id: this.getNextId(),
      ...vendorData,
      created_at: new Date().toISOString(),
    };
    this.vendors.push(newVendor);
    return newVendor;
  },
  updateVendor(id, vendorData) {
    const index = this.vendors.findIndex((v) => v.id === Number(id));
    if (index === -1) return null;

    // Create a deep copy of the original vendor
    const updatedVendor = JSON.parse(JSON.stringify(this.vendors[index]));

    // Apply only the fields that are provided
    Object.keys(vendorData).forEach((key) => {
      if (vendorData[key] !== undefined) {
        updatedVendor[key] = vendorData[key];
      }
    });

    // Ensure id remains the same
    updatedVendor.id = Number(id);

    this.vendors[index] = updatedVendor;
    return updatedVendor;
  },

  deleteVendor(id) {
    const index = this.vendors.findIndex((v) => v.id === Number(id));
    if (index === -1) return null;

    const deletedVendor = this.vendors[index];
    this.vendors.splice(index, 1);
    return deletedVendor;
  },

  // Helper method to reset data for testing
  reset() {
    this.vendors = [
      {
        id: 1,
        name: "Test Vendor 1",
        category: "Test Category 1",
        contact_email: "test1@example.com",
        phone_number: "123-456-7890",
        address: "123 Test St, Test City",
        created_at: "2025-06-21T12:00:00Z",
        user_id: 1,
        org_id: 1,
      },
      {
        id: 2,
        name: "Test Vendor 2",
        category: "Test Category 2",
        contact_email: "test2@example.com",
        phone_number: "987-654-3210",
        address: "456 Test Ave, Test City",
        created_at: "2025-06-21T12:30:00Z",
        user_id: 1,
        org_id: 1,
      },
      {
        id: 3,
        name: "Other User Vendor",
        category: "Other Category",
        contact_email: "other@example.com",
        phone_number: "555-555-5555",
        address: "789 Other St, Other City",
        created_at: "2025-06-21T13:00:00Z",
        user_id: 2,
        org_id: 2,
      },
    ];
  },
};

module.exports = mockInMemoryDb;
