const vendorController = require("../../src/controllers/vendorController");
const Vendor = require("../../src/models/vendor");

// Mock the vendor model to isolate controller tests
jest.mock("../../src/models/vendor");

describe("Vendor Controller", () => {
  let mockRequest;
  let mockResponse;

  // Set up mock request and response objects before each test
  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
      user: { id: 1, org_id: 1 },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllVendors", () => {
    test("should return all vendors with 200 status code", async () => {
      const mockVendors = [
        { id: 1, name: "Vendor 1" },
        { id: 2, name: "Vendor 2" },
      ];

      Vendor.getAll.mockResolvedValue(mockVendors);

      await vendorController.getAllVendors(mockRequest, mockResponse);

      expect(Vendor.getAll).toHaveBeenCalledWith(1, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockVendors,
      });
    });

    test("should handle errors with 500 status code", async () => {
      Vendor.getAll.mockRejectedValue(new Error("Database error"));

      await vendorController.getAllVendors(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Server error while fetching vendors",
      });
    });
  });

  describe("getVendorById", () => {
    test("should return a vendor with 200 status code", async () => {
      const mockVendor = { id: 1, name: "Test Vendor" };

      mockRequest.params.id = "1";
      Vendor.getById.mockResolvedValue(mockVendor);

      await vendorController.getVendorById(mockRequest, mockResponse);

      expect(Vendor.getById).toHaveBeenCalledWith(1, 1, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockVendor,
      });
    });

    test("should return 404 when vendor not found", async () => {
      mockRequest.params.id = "999";
      Vendor.getById.mockResolvedValue(null);

      await vendorController.getVendorById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendor not found",
      });
    });

    test("should handle errors with 500 status code", async () => {
      mockRequest.params.id = "1";
      Vendor.getById.mockRejectedValue(new Error("Database error"));

      await vendorController.getVendorById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Server error while fetching vendor",
      });
    });
  });

  describe("createVendor", () => {
    test("should create a vendor and return 201 status code", async () => {
      const vendorData = {
        name: "New Vendor",
        category: "New Category",
        contact_email: "test@example.com",
      };

      const createdVendor = {
        id: 4,
        ...vendorData,
        user_id: 1,
        org_id: 1,
        created_at: "2025-06-21T12:00:00Z",
      };

      mockRequest.body = vendorData;
      Vendor.create.mockResolvedValue(createdVendor);

      await vendorController.createVendor(mockRequest, mockResponse);

      expect(Vendor.create).toHaveBeenCalledWith({
        ...vendorData,
        user_id: 1,
        org_id: 1,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: createdVendor,
      });
    });

    test("should return 400 when required fields are missing", async () => {
      mockRequest.body = { name: "Incomplete Vendor" }; // Missing category

      await vendorController.createVendor(mockRequest, mockResponse);

      expect(Vendor.create).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Please provide name and category for the vendor",
      });
    });

    test("should handle errors with 500 status code", async () => {
      mockRequest.body = {
        name: "Error Vendor",
        category: "Error Category",
      };

      Vendor.create.mockRejectedValue(new Error("Database error"));

      await vendorController.createVendor(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Server error while creating vendor",
      });
    });
  });

  describe("updateVendor", () => {
    test("should update a vendor and return 200 status code", async () => {
      const updateData = {
        name: "Updated Vendor",
        category: "Updated Category",
      };

      const updatedVendor = {
        id: 1,
        ...updateData,
        contact_email: "test@example.com",
        user_id: 1,
        org_id: 1,
      };

      mockRequest.params.id = "1";
      mockRequest.body = updateData;

      Vendor.getById.mockResolvedValue({ id: 1 }); // Vendor exists
      Vendor.update.mockResolvedValue(updatedVendor);

      await vendorController.updateVendor(mockRequest, mockResponse);

      expect(Vendor.getById).toHaveBeenCalledWith(1, 1, 1);
      expect(Vendor.update).toHaveBeenCalledWith(1, updateData, 1, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: updatedVendor,
      });
    });

    test("should return 404 when vendor not found", async () => {
      mockRequest.params.id = "999";
      mockRequest.body = { name: "Not Found Vendor" };

      Vendor.getById.mockResolvedValue(null);

      await vendorController.updateVendor(mockRequest, mockResponse);

      expect(Vendor.update).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendor not found or you do not have permission to update it",
      });
    });

    test("should handle errors with 500 status code", async () => {
      mockRequest.params.id = "1";
      mockRequest.body = { name: "Error Vendor" };

      Vendor.getById.mockResolvedValue({ id: 1 });
      Vendor.update.mockRejectedValue(new Error("Database error"));

      await vendorController.updateVendor(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Server error while updating vendor",
      });
    });
  });

  describe("deleteVendor", () => {
    test("should delete a vendor and return 200 status code", async () => {
      mockRequest.params.id = "1";

      Vendor.getById.mockResolvedValue({ id: 1 }); // Vendor exists
      Vendor.delete.mockResolvedValue({ id: 1 });

      await vendorController.deleteVendor(mockRequest, mockResponse);

      expect(Vendor.getById).toHaveBeenCalledWith(1, 1, 1);
      expect(Vendor.delete).toHaveBeenCalledWith(1, 1, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Vendor deleted successfully",
        data: {},
      });
    });

    test("should return 404 when vendor not found", async () => {
      mockRequest.params.id = "999";

      Vendor.getById.mockResolvedValue(null);

      await vendorController.deleteVendor(mockRequest, mockResponse);

      expect(Vendor.delete).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Vendor not found or you do not have permission to delete it",
      });
    });

    test("should handle errors with 500 status code", async () => {
      mockRequest.params.id = "1";

      Vendor.getById.mockResolvedValue({ id: 1 });
      Vendor.delete.mockRejectedValue(new Error("Database error"));

      await vendorController.deleteVendor(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Server error while deleting vendor",
      });
    });
  });
});
