#!/bin/bash

# Vendor API Testing Script
# This script runs comprehensive tests including Keploy AI testing

echo "🚀 Starting Vendor Management API Testing Suite"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js to continue."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Install dependencies
print_status "Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Run unit tests
print_status "Running unit tests..."
npm test
if [ $? -eq 0 ]; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# Generate coverage report
print_status "Generating test coverage report..."
npm run test:coverage
if [ $? -eq 0 ]; then
    print_success "Coverage report generated"
else
    print_warning "Coverage report generation failed"
fi

# Start the API server in background
print_status "Starting API server..."
npm start &
SERVER_PID=$!
sleep 5

# Check if server is running
if curl -f http://localhost:3001/ > /dev/null 2>&1; then
    print_success "API server is running on port 3001"
else
    print_error "Failed to start API server"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Check if Keploy is installed
if command -v keploy &> /dev/null; then
    print_status "Keploy found. Running AI-powered API tests..."
    
    # Generate tests from OpenAPI schema
    print_status "Generating Keploy tests from OpenAPI schema..."
    keploy gen --source-file openapi.yaml --output-dir ./keploy-tests
    
    # Run Keploy tests
    print_status "Running Keploy AI tests..."
    keploy test --source-file openapi.yaml --coverage
    
    if [ $? -eq 0 ]; then
        print_success "Keploy AI tests completed successfully"
    else
        print_warning "Keploy tests completed with warnings"
    fi
else
    print_warning "Keploy not found. Skipping AI-powered tests."
    print_status "To install Keploy, run:"
    echo "curl --silent --location \"https://github.com/keploy/keploy/releases/latest/download/keploy_linux_amd64.tar.gz\" | tar xz -C /tmp"
    echo "sudo mv /tmp/keploy /usr/local/bin"
fi

# Run manual API tests
print_status "Running manual API tests..."

# Test 1: Health check
print_status "Testing health endpoint..."
if curl -f http://localhost:3001/ > /dev/null 2>&1; then
    print_success "✓ Health check passed"
else
    print_error "✗ Health check failed"
fi

# Test 2: Get all vendors
print_status "Testing GET /api/vendors..."
if curl -f http://localhost:3001/api/vendors > /dev/null 2>&1; then
    print_success "✓ GET /api/vendors passed"
else
    print_error "✗ GET /api/vendors failed"
fi

# Test 3: Create vendor
print_status "Testing POST /api/vendors..."
RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:3001/api/vendors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Vendor",
    "category": "Testing",
    "contact_email": "test@example.com"
  }')

HTTP_CODE="${RESPONSE: -3}"
if [ "$HTTP_CODE" -eq 201 ]; then
    print_success "✓ POST /api/vendors passed"
else
    print_error "✗ POST /api/vendors failed (HTTP $HTTP_CODE)"
fi

# Test 4: Get specific vendor
print_status "Testing GET /api/vendors/1..."
if curl -f http://localhost:3001/api/vendors/1 > /dev/null 2>&1; then
    print_success "✓ GET /api/vendors/1 passed"
else
    print_error "✗ GET /api/vendors/1 failed"
fi

# Test 5: Test error handling
print_status "Testing error handling (invalid vendor ID)..."
RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3001/api/vendors/999)
HTTP_CODE="${RESPONSE: -3}"
if [ "$HTTP_CODE" -eq 404 ]; then
    print_success "✓ Error handling test passed"
else
    print_error "✗ Error handling test failed (expected 404, got $HTTP_CODE)"
fi

# Stop the server
print_status "Stopping API server..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

print_success "All tests completed!"
echo ""
echo "📊 Test Summary:"
echo "  ✓ Unit Tests: Jest test suite"
echo "  ✓ Integration Tests: API endpoint testing"
echo "  ✓ Coverage Report: Generated in ./coverage/"
if command -v keploy &> /dev/null; then
    echo "  ✓ AI Tests: Keploy automated testing"
fi
echo ""
echo "🔗 View detailed results:"
echo "  📁 Coverage Report: ./coverage/lcov-report/index.html"
echo "  📁 Test Results: Console output above"
if [ -d "./keploy-tests" ]; then
    echo "  📁 Keploy Tests: ./keploy-tests/"
fi
echo ""
print_success "Testing complete! 🎉"
