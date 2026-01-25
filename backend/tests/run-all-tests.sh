#!/bin/bash
################################################################################
# b-nova-v3 AI Service - Master Test Runner
# 
# Runs all test suites in sequence
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# Configuration
SERVICE_URL="${AI_SERVICE_URL:-http://localhost:8000}"
TEST_IMAGE="${TEST_IMAGE:-./test-image.jpg}"

################################################################################
# FUNCTIONS
################################################################################

print_header() {
    echo ""
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}${CYAN}║     b-nova-v3 AI Service - Master Test Runner            ║${RESET}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${BOLD}${BLUE}▶ $1${RESET}"
    echo -e "${CYAN}${'═'%.s{1..60}}${RESET}"
    echo ""
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${YELLOW}Running: ${test_name}${RESET}"
    echo ""
    
    if eval "$test_command"; then
        echo ""
        echo -e "${GREEN}✓ ${test_name} passed${RESET}"
        return 0
    else
        echo ""
        echo -e "${RED}✗ ${test_name} failed${RESET}"
        return 1
    fi
}

################################################################################
# MAIN
################################################################################

print_header

echo -e "${BOLD}Configuration:${RESET}"
echo "  Service URL: ${SERVICE_URL}"
echo "  Test Image:  ${TEST_IMAGE}"
echo ""

# Check if test image exists
if [ ! -f "$TEST_IMAGE" ]; then
    echo -e "${RED}❌ Test image not found: ${TEST_IMAGE}${RESET}"
    echo ""
    echo "Please provide a test image or set TEST_IMAGE environment variable."
    exit 1
fi

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

################################################################################
# 1. STARTUP SIMULATION
################################################################################

print_section "1. Startup Simulation & Health Check"

if run_test "Startup Simulation" "node test-startup-simulation.js startup"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi

((TOTAL_TESTS++))

################################################################################
# 2. INTEGRATION TESTS
################################################################################

print_section "2. Integration Tests"

if run_test "Integration Tests" "node test-integration.js"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi

((TOTAL_TESTS++))

################################################################################
# 3. PERFORMANCE TESTS
################################################################################

print_section "3. Performance Tests"

if run_test "Single Prediction Benchmark" "node test-load-performance.js single"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi

((TOTAL_TESTS++))

if run_test "Load Test (10 concurrent, 50 total)" "node test-load-performance.js load 10 50"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi

((TOTAL_TESTS++))

################################################################################
# 4. MONITORING TEST
################################################################################

print_section "4. Health Monitoring"

if run_test "Health Monitoring (30s)" "node test-startup-simulation.js monitor 30000 5000"; then
    ((PASSED_TESTS++))
else
    ((FAILED_TESTS++))
fi

((TOTAL_TESTS++))

################################################################################
# SUMMARY
################################################################################

echo ""
echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║                    FINAL SUMMARY                          ║${RESET}"
echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""
echo "  Total Test Suites:  ${TOTAL_TESTS}"
echo -e "  Passed:             ${GREEN}${PASSED_TESTS}${RESET}"

if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "  Failed:             ${RED}${FAILED_TESTS}${RESET}"
else
    echo -e "  Failed:             ${FAILED_TESTS}"
fi

SUCCESS_RATE=$(echo "scale=2; ($PASSED_TESTS / $TOTAL_TESTS) * 100" | bc)
echo "  Success Rate:       ${SUCCESS_RATE}%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All test suites passed!${RESET}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some test suites failed${RESET}"
    echo ""
    exit 1
fi
