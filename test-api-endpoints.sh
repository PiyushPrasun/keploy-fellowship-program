#!/bin/bash

# API Endpoint Testing Script for CI/CD
# This script tests all the main API endpoints

BASE_URL="http://localhost:3001"
TIMEOUT=30

echo "🚀 Starting API endpoint tests..."
echo "Base URL: $BASE_URL"

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data=$4
    local headers=$5
    
    echo "Testing: $method $endpoint"
    
    if [ -n "$data" ]; then
        if [ -n "$headers" ]; then
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" -H "$headers" -d "$data" --max-time $TIMEOUT)
        else
            response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" -d "$data" --max-time $TIMEOUT)
        fi
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" --max-time $TIMEOUT)
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Extract body (all lines except last)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ PASS: $method $endpoint (Status: $status_code)"
        return 0
    else
        echo "❌ FAIL: $method $endpoint (Expected: $expected_status, Got: $status_code)"
        echo "Response body: $body"
        return 1
    fi
}

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
for i in $(seq 1 30); do
    if curl -s --max-time 5 "$BASE_URL/" > /dev/null 2>&1; then
        echo "✅ Server is ready after $i attempts"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Server failed to start within timeout"
        exit 1
    fi
    echo "Attempt $i/30 - waiting for server..."
    sleep 2
done

# Test suite
echo ""
echo "🧪 Running API tests..."

# Health check
test_endpoint "GET" "/" "200" || exit 1

# Get all vendors
test_endpoint "GET" "/api/vendors" "200" || exit 1

# Get specific vendor (assuming vendor with ID 1 exists from seed data)
test_endpoint "GET" "/api/vendors/1" "200" || exit 1

# Create vendor
test_endpoint "POST" "/api/vendors" "201" '{"name": "Test Vendor CI", "category": "Testing", "email": "test@example.com", "phone": "123-456-7890"}' "Content-Type: application/json" || exit 1

# Test invalid vendor creation (missing required fields)
test_endpoint "POST" "/api/vendors" "400" '{"name": ""}' "Content-Type: application/json" || exit 1

# Test non-existent vendor
test_endpoint "GET" "/api/vendors/999999" "404" || exit 1

echo ""
echo "🎉 All API tests passed successfully!"
