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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Backwards compatibility: allow SERVICE_URL, prefer AI_SERVICE_URL
export AI_SERVICE_URL="${AI_SERVICE_URL:-${SERVICE_URL:-http://localhost:8000}}"

# Default test image location (can be overridden)
TEST_IMAGE="${TEST_IMAGE:-${REPO_ROOT}/tests/test-image.jpg}"
export TEST_IMAGE

FRONTEND_TEST_DIR="${REPO_ROOT}/frontend/tests"

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
    printf '%b' "${CYAN}"
    printf '═%.0s' {1..60}
    printf '%b\n\n' "${RESET}"
    echo ""
}

run_test_with_timeout() {
    local name="$1"
    local cmd="$2"
    local timeout_sec="${3:-60}"

    echo -e "${YELLOW}Running: ${name}${RESET}"
    echo ""

    ((TOTAL_TESTS++))

    if timeout "${timeout_sec}" bash -c "$cmd"; then
        echo ""
        echo -e "${GREEN}✓ ${name} passed${RESET}"
        ((PASSED_TESTS++))
        return 0
    else
        echo ""
        echo -e "${RED}✗ ${name} failed or timed out${RESET}"
        ((FAILED_TESTS++))
        echo ""
        echo -e "${RED}Fail-fast: exiting due to failed test: ${name}${RESET}"
        echo "  Passed: ${PASSED_TESTS}  Failed: ${FAILED_TESTS}  Total: ${TOTAL_TESTS}"
        echo ""
        exit 1
    fi
}

################################################################################
# MAIN
################################################################################

print_header

echo -e "${BOLD}Configuration:${RESET}"
echo "  Service URL: ${AI_SERVICE_URL}"
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

run_test_with_timeout "Startup Simulation" "node ${FRONTEND_TEST_DIR}/test-startup-simulation.js startup" 60

################################################################################
# 2. INTEGRATION TESTS
################################################################################

print_section "2. Integration Tests"

run_test_with_timeout "Integration Tests" "node ${FRONTEND_TEST_DIR}/test-integration.js" 120

################################################################################
# 3. PERFORMANCE TESTS
################################################################################

print_section "3. Performance Tests"

run_test_with_timeout "Single Prediction Benchmark" "node ${FRONTEND_TEST_DIR}/test-load-performance.js single" 60

run_test_with_timeout "Load Test (10 concurrent, 50 total)" "node ${FRONTEND_TEST_DIR}/test-load-performance.js load 10 50" 300

################################################################################
# 4. MONITORING TEST
################################################################################

print_section "4. Health Monitoring"

run_test_with_timeout "Health Monitoring (30s)" "node ${FRONTEND_TEST_DIR}/test-startup-simulation.js monitor 30000 5000" 90

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
