# API Endpoint Testing Script for Windows/PowerShell
# This script tests all the main API endpoints

$BASE_URL = "http://localhost:3001"
$TIMEOUT = 30

Write-Host "🚀 Starting API endpoint tests..." -ForegroundColor Green
Write-Host "Base URL: $BASE_URL"

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [int]$ExpectedStatus,
        [string]$Data = $null,
        [hashtable]$Headers = @{}
    )
    
    Write-Host "Testing: $Method $Endpoint" -ForegroundColor Yellow
    
    try {
        $uri = "$BASE_URL$Endpoint"
        $requestParams = @{
            Uri = $uri
            Method = $Method
            UseBasicParsing = $true
            TimeoutSec = $TIMEOUT
        }
        
        if ($Headers.Count -gt 0) {
            $requestParams.Headers = $Headers
        }
        
        if ($Data) {
            $requestParams.Body = $Data
        }
        
        $response = Invoke-WebRequest @requestParams -ErrorAction Stop
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✅ PASS: $Method $Endpoint (Status: $statusCode)" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ FAIL: $Method $Endpoint (Expected: $ExpectedStatus, Got: $statusCode)" -ForegroundColor Red
            Write-Host "Response: $($response.Content)" -ForegroundColor Red
            return $false
        }
    }
    catch {
        # Handle HTTP error responses
        if ($_.Exception -is [Microsoft.PowerShell.Commands.HttpResponseException]) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            if ($statusCode -eq $ExpectedStatus) {
                Write-Host "✅ PASS: $Method $Endpoint (Status: $statusCode)" -ForegroundColor Green
                return $true
            } else {
                Write-Host "❌ FAIL: $Method $Endpoint (Expected: $ExpectedStatus, Got: $statusCode)" -ForegroundColor Red
                return $false
            }
        }
        # Handle other errors
        Write-Host "❌ ERROR: $Method $Endpoint - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Wait for server to be ready
Write-Host "⏳ Waiting for server to be ready..." -ForegroundColor Yellow
$serverReady = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Server is ready after $i attempts" -ForegroundColor Green
            $serverReady = $true
            break
        }
    }
    catch {
        # Server not ready yet
    }
    
    if ($i -eq 30) {
        Write-Host "❌ Server failed to start within timeout" -ForegroundColor Red
        exit 1
    }
    Write-Host "Attempt $i/30 - waiting for server..."
    Start-Sleep -Seconds 2
}

if (-not $serverReady) {
    Write-Host "❌ Server is not ready" -ForegroundColor Red
    exit 1
}

# Test suite
Write-Host ""
Write-Host "🧪 Running API tests..." -ForegroundColor Green

$allTestsPassed = $true

# Health check
if (-not (Test-Endpoint -Method "GET" -Endpoint "/" -ExpectedStatus 200)) {
    $allTestsPassed = $false
}

# Get all vendors
if (-not (Test-Endpoint -Method "GET" -Endpoint "/api/vendors" -ExpectedStatus 200)) {
    $allTestsPassed = $false
}

# Get specific vendor (assuming vendor with ID 1 exists from seed data)
if (-not (Test-Endpoint -Method "GET" -Endpoint "/api/vendors/1" -ExpectedStatus 200)) {
    $allTestsPassed = $false
}

# Create vendor
$createVendorData = '{"name": "Test Vendor CI", "category": "Testing", "email": "test@example.com", "phone": "123-456-7890"}'
$createHeaders = @{"Content-Type" = "application/json"}
if (-not (Test-Endpoint -Method "POST" -Endpoint "/api/vendors" -ExpectedStatus 201 -Data $createVendorData -Headers $createHeaders)) {
    $allTestsPassed = $false
}

# Test invalid vendor creation (missing required fields)
$invalidData = '{"name": ""}'
if (-not (Test-Endpoint -Method "POST" -Endpoint "/api/vendors" -ExpectedStatus 400 -Data $invalidData -Headers $createHeaders)) {
    $allTestsPassed = $false
}

# Test non-existent vendor
if (-not (Test-Endpoint -Method "GET" -Endpoint "/api/vendors/999999" -ExpectedStatus 404)) {
    $allTestsPassed = $false
}

Write-Host ""
if ($allTestsPassed) {
    Write-Host "🎉 All API tests passed successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some tests failed!" -ForegroundColor Red
    exit 1
}
