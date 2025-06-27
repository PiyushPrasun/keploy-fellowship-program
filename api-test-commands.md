# Vendor Management API Test Commands

## 1. Health Check

curl -X GET http://localhost:3001/

## 2. Get All Vendors

curl -X GET http://localhost:3001/api/vendors \
 -H "Content-Type: application/json"

## 3. Get Specific Vendor

curl -X GET http://localhost:3001/api/vendors/1 \
 -H "Content-Type: application/json"

## 4. Create New Vendor

curl -X POST http://localhost:3001/api/vendors \
 -H "Content-Type: application/json" \
 -d '{
"name": "Test Vendor Corp",
"category": "Technology",
"contact_email": "contact@testvendor.com",
"phone_number": "555-0123",
"address": "123 Tech Street, Innovation City, TC 12345"
}'

## 5. Update Vendor

curl -X PUT http://localhost:3001/api/vendors/1 \
 -H "Content-Type: application/json" \
 -d '{
"name": "Updated Vendor Name",
"category": "Updated Technology",
"contact_email": "updated@testvendor.com",
"phone_number": "555-0124",
"address": "456 Updated Street, New City, NC 67890"
}'

## 6. Delete Vendor

curl -X DELETE http://localhost:3001/api/vendors/4 \
 -H "Content-Type: application/json"

## 7. Create Vendor with Missing Required Fields (Should return 400)

curl -X POST http://localhost:3001/api/vendors \
 -H "Content-Type: application/json" \
 -d '{
"contact_email": "incomplete@test.com"
}'

## 8. Get Non-existent Vendor (Should return 404)

curl -X GET http://localhost:3001/api/vendors/999 \
 -H "Content-Type: application/json"

## 9. Update Non-existent Vendor (Should return 404)

curl -X PUT http://localhost:3001/api/vendors/999 \
 -H "Content-Type: application/json" \
 -d '{
"name": "Non-existent Vendor"
}'

## 10. Test with Authentication Header (Optional - for future implementation)

curl -X GET http://localhost:3001/api/vendors \
 -H "Content-Type: application/json" \
 -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example.token"

## Authentication Endpoints (Future Implementation)

## 11. User Login (Future)

curl -X POST http://localhost:3001/api/auth/login \
 -H "Content-Type: application/json" \
 -d '{
"email": "user@example.com",
"password": "password123"
}'

## 12. User Registration (Future)

curl -X POST http://localhost:3001/api/auth/register \
 -H "Content-Type: application/json" \
 -d '{
"email": "newuser@example.com",
"password": "securepassword123",
"name": "New User"
}'
