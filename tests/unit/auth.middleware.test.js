const auth = require("../../src/middleware/auth");
const jwt = require("jsonwebtoken");

describe("Auth Middleware", () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {
      header: jest.fn(),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  test("should add user to request if valid token provided", () => {
    const token = jwt.sign(
      { user: { id: 1, name: "Test User" } },
      process.env.JWT_SECRET || "test-secret-key"
    );

    mockRequest.header.mockReturnValue(`Bearer ${token}`);

    auth(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.user).toBeDefined();
    expect(mockRequest.user.id).toBe(1);
    expect(mockRequest.user.name).toBe("Test User");
    expect(nextFunction).toHaveBeenCalled();
  });

  test("should proceed without user if no token provided (optional auth)", () => {
    mockRequest.header.mockReturnValue(null);

    auth(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.user).toBeNull();
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  test("should proceed without user if invalid token provided (optional auth)", () => {
    mockRequest.header.mockReturnValue("Bearer invalid-token");

    auth(mockRequest, mockResponse, nextFunction);

    expect(mockRequest.user).toBeNull();
    expect(nextFunction).toHaveBeenCalled();
  });

  test("should handle server errors properly", () => {
    mockRequest.header.mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    auth(mockRequest, mockResponse, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: "Server Error",
    });
  });
});
