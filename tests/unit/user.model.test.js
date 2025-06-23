const User = require("../../src/models/user");
const jwt = require("jsonwebtoken");

// Mock environment variables and JWT
jest.mock("jsonwebtoken");
process.env.JWT_SECRET = "test-secret-key";

describe("User Model", () => {
  describe("generateToken", () => {
    test("should generate a JWT token with user information", () => {
      // Prepare
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        role: "admin",
        org_id: 1,
        password: "should-not-be-included-in-token",
      };

      // Mock JWT sign function
      jwt.sign.mockReturnValue("mock-jwt-token");

      // Execute
      const token = User.generateToken(mockUser);

      // Assert
      expect(token).toBe("mock-jwt-token");
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            role: mockUser.role,
            org_id: mockUser.org_id,
          },
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // Verify that sensitive data is not included
      const payload = jwt.sign.mock.calls[0][0];
      expect(payload.user.password).toBeUndefined();
    });

    test("should handle users with missing fields", () => {
      // Prepare
      const mockUser = {
        id: 2,
        email: "minimal@example.com",
      };

      // Mock JWT sign function
      jwt.sign.mockReturnValue("minimal-jwt-token");

      // Execute
      const token = User.generateToken(mockUser);

      // Assert
      expect(token).toBe("minimal-jwt-token");
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            name: undefined,
            role: undefined,
            org_id: undefined,
          },
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
    });
  });
});
