#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Test statistics
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Store cookies and tokens
ADMIN_COOKIE=""
STAFF_COOKIE=""
CREATED_STAFF_ID=""
CREATED_FARMER_ID=""
CREATED_SURVEY_NUMBER=""

# Base URL
BASE_URL="http://localhost:3000/api"

# Test files
PROFILE_PIC="pp.png"
TEST_DOC="test_doc.pdf"

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Test case function
test_case() {
    local name=$1
    local result=$2
    local expected_status=$3
    local actual_status=$4
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = true ] && [ "$actual_status" = "$expected_status" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo -e "${GREEN}✓ PASSED: $name${NC}"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${RED}✗ FAILED: $name${NC}"
        echo -e "${RED}Expected status: $expected_status, Got: $actual_status${NC}"
    fi
}

# Print test summary
print_summary() {
    echo -e "\n${YELLOW}=== Test Summary ===${NC}"
    echo -e "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
}

log "Starting API Tests..."

# Test 1: Admin Login
log "Testing Admin Login..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin1@test.com","password":"admin123"}' \
    -c cookies.txt)

status_code=$(echo "$response" | tail -n1)
ADMIN_COOKIE=$(cat cookies.txt | grep session | cut -d$'\t' -f7)
test_case "Admin Login" true "200" "$status_code"
sleep 1
# Test 2: Create Staff User (as Admin)
log "Testing Staff User Creation..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/users" \
    -H "Content-Type: application/json" \
    -H "Cookie: session=${ADMIN_COOKIE}" \
    -d '{
        "email":"teststaff@test.com",
        "password":"staff123",
        "name":"Test Staff"
    }')
sleep 1
status_code=$(echo "$response" | tail -n1)
CREATED_STAFF_ID=$(echo "$response" | head -n1 | jq -r '.user.id')
test_case "Create Staff User" true "200" "$status_code"
sleep 1
# Test 3: Staff Login
log "Testing Staff Login..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"teststaff@test.com","password":"staff123"}' \
    -c staff_cookies.txt)

status_code=$(echo "$response" | tail -n1)
STAFF_COOKIE=$(cat staff_cookies.txt | grep session | awk '{print $7}')
test_case "Staff Login" true "200" "$status_code"
sleep 1
# Test 4: Staff trying to create another staff (should fail)
log "Testing Staff creating Staff (should fail)..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/users" \
    -H "Content-Type: application/json" \
    -H "Cookie: session=${STAFF_COOKIE}" \
    -d '{
        "email":"staff2@test.com",
        "password":"staff123",
        "name":"Test Staff 2"
    }')
sleep 1
status_code=$(echo "$response" | tail -n1)
test_case "Staff Creating Staff (Should Fail)" true "403" "$status_code"
sleep 1
# Test 5: Create Farmer (as Staff)
log "Testing Farmer Creation..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/farmers" \
    -H "Cookie: session=${STAFF_COOKIE}" \
    -F "farmerName=Test Farmer" \
    -F "relationship=SELF" \
    -F "gender=MALE" \
    -F "community=General" \
    -F "aadharNumber=123452349012" \
    -F "contactNumber=9876543210" \
    -F "state=Karnataka" \
    -F "district=Bangalore" \
    -F "mandal=Test Mandal" \
    -F "village=Test Village" \
    -F "panchayath=Test Panchayath" \
    -F "dateOfBirth=1990-01-01" \
    -F "age=33" \
    -F "ifscCode=SBIN0125640" \
    -F "accountNumber=12345678901" \
    -F "branchName=Test Branch" \
    -F "bankAddress=Test Address" \
    -F "bankName=SBI" \
    -F "bankCode=SBI001" \
    -F 'fields=[{"areaHa":"5.5","yieldEstimate":"2000","location":"{\"lat\":13.2468,\"lng\":77.7134}"}]' \
    -F "profilePic=@$PROFILE_PIC" \
    -F "aadharDoc=@$TEST_DOC" \
    -F "bankDoc=@$TEST_DOC" \
    -F "fieldDoc_0=@$TEST_DOC")

status_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | head -n1)
CREATED_FARMER_ID=$(echo "$response_body" | jq -r '.farmer.id')
CREATED_SURVEY_NUMBER=$(echo "$response_body" | jq -r '.farmer.surveyNumber')
test_case "Create Farmer" true "200" "$status_code"
sleep 1
# Test 6: Get Farmer List with Search
log "Testing Farmer List Search..."
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/farmers?search=Test" \
    -H "Cookie: session=${STAFF_COOKIE}")

status_code=$(echo "$response" | tail -n1)
test_case "Search Farmers" true "200" "$status_code"
sleep 1
# Test 7: Get Single Farmer
log "Testing Single Farmer Fetch..."
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/farmers/${CREATED_SURVEY_NUMBER}" \
    -H "Cookie: session=${STAFF_COOKIE}")

status_code=$(echo "$response" | tail -n1)
test_case "Get Single Farmer" true "200" "$status_code"
sleep 1
# Test 8: Update Farmer (as Admin)
log "Testing Farmer Update..."
response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/farmers/${CREATED_SURVEY_NUMBER}" \
    -H "Cookie: session=${ADMIN_COOKIE}" \
    -F "farmerName=Updated Farmer" \
    -F "contactNumber=9876543211")

status_code=$(echo "$response" | tail -n1)
test_case "Update Farmer" true "200" "$status_code"
sleep 1
# Test 9: Export Farmers as Excel
log "Testing Excel Export..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/export/farmers" \
    -H "Content-Type: application/json" \
    -H "Cookie: session=${ADMIN_COOKIE}" \
    -d '{
        "options": {
            "format": "EXCEL",
            "range": "ALL"
        }
    }')

status_code=$(echo "$response" | tail -n1)
test_case "Export Excel" true "200" "$status_code"
sleep 1
# Test 10: Export Farmers as PDF
log "Testing PDF Export..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/export/farmers" \
    -H "Content-Type: application/json" \
    -H "Cookie: session=${ADMIN_COOKIE}" \
    -d '{
        "options": {
            "format": "PDF",
            "range": "ALL"
        }
    }')

status_code=$(echo "$response" | tail -n1)
test_case "Export PDF" true "200" "$status_code"
sleep 1
# Test 11: Get Document URL
log "Testing Document URL Generation..."
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/documents/profile-pic/${CREATED_FARMER_ID}/url" \
    -H "Cookie: session=${STAFF_COOKIE}")

status_code=$(echo "$response" | tail -n1)
test_case "Get Document URL" true "200" "$status_code"
sleep 1
# Test 12: Toggle Staff Status (as Admin)
log "Testing Staff Status Toggle..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/users/${CREATED_STAFF_ID}/toggle-status" \
    -H "Cookie: session=${ADMIN_COOKIE}")

status_code=$(echo "$response" | tail -n1)
test_case "Toggle Staff Status" true "200" "$status_code"
sleep 1
# Test 13: Deactivated Staff Login (should fail)
log "Testing Deactivated Staff Login..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"teststaff@test.com","password":"staff123"}')

status_code=$(echo "$response" | tail -n1)
test_case "Deactivated Staff Login" true "403" "$status_code"
sleep 1
# Test 14: Delete Farmer (as Admin)
log "Testing Farmer Deletion..."
response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/farmers/${CREATED_SURVEY_NUMBER}" \
    -H "Cookie: session=${ADMIN_COOKIE}")

status_code=$(echo "$response" | tail -n1)
test_case "Delete Farmer" true "200" "$status_code"
sleep 1
# Test 15: Logout Admin
log "Testing Admin Logout..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/logout" \
    -H "Cookie: session=${ADMIN_COOKIE}")

status_code=$(echo "$response" | tail -n1)
test_case "Admin Logout" true "200" "$status_code"
sleep 1
# Clean up cookie files
rm -f cookies.txt staff_cookies.txt

# Print final summary
print_summary

# Exit with status based on test results
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
else
    exit 1
fi