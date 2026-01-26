#!/usr/bin/env bash
set -euo pipefail

# Simple tests for dump parsing logic used by bootstrap.sh
# Tests: extract dumped_version, roles, and extensions

TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

cat > "$TMPDIR/dump.sql" <<'SQL'
-- Dumped from database version 12.7
-- Some header
CREATE ROLE "alice" WITH LOGIN SUPERUSER;
CREATE ROLE bob;

CREATE EXTENSION IF NOT EXISTS "hstore";
CREATE EXTENSION IF NOT EXISTS uuid_ossp;

-- normal SQL
CREATE TABLE foo (id serial primary key);
SQL

# extract dumped version
dumped_version=$(grep -m1 -E "Dumped from database version|PostgreSQL" "$TMPDIR/dump.sql" | sed -n 's/.*version \([0-9]\+\.[0-9]\+\).*/\1/p' || true)
if [ "$dumped_version" != "12.7" ]; then
    echo "FAILED: dumped_version expected 12.7 got '$dumped_version'"
    exit 2
fi

echo "PASSED: dumped_version -> $dumped_version"

# extract roles
role_lines=$(grep -nE "^[[:space:]]*CREATE ROLE" "$TMPDIR/dump.sql" || true)
if [ -z "$role_lines" ]; then
    echo "FAILED: no role lines found"
    exit 3
fi

# parse role names
roles_found=""
echo "$role_lines" | while IFS= read -r line; do
    sql=$(echo "$line" | sed -n 's/^[0-9]\+://p')
    role=$(echo "$sql" | sed -E 's/CREATE ROLE "?([^"; ]+)"?.*/\1/I')
    roles_found+="$role ";
done

# Because the while loop runs in a subshell, extract directly using grep/sed instead
r1=$(grep -E "^[[:space:]]*CREATE ROLE" "$TMPDIR/dump.sql" | sed -n '1p' | sed -E 's/CREATE ROLE "?([^"; ]+)"?.*/\1/I')
r2=$(grep -E "^[[:space:]]*CREATE ROLE" "$TMPDIR/dump.sql" | sed -n '2p' | sed -E 's/CREATE ROLE "?([^"; ]+)"?.*/\1/I')
if [ "$r1" != "alice" ] || [ "$r2" != "bob" ]; then
    echo "FAILED: roles parsed incorrectly: got '$r1' and '$r2'"
    exit 4
fi

echo "PASSED: roles -> $r1, $r2"

# extract extensions
extensions=$(grep -Eoi "CREATE EXTENSION IF NOT EXISTS \"?[a-z0-9_]+\"?" "$TMPDIR/dump.sql" | sed -E 's/CREATE EXTENSION IF NOT EXISTS "?([^"; ]+)"?.*/\1/' | sort -u || true)
if [ -z "$extensions" ]; then
    echo "FAILED: no extensions parsed"
    exit 5
fi

if ! echo "$extensions" | grep -qw "hstore" || ! echo "$extensions" | grep -qw "uuid_ossp"; then
    echo "FAILED: extensions parsed incorrectly: $extensions"
    exit 6
fi

echo "PASSED: extensions -> $extensions"

echo "All dump parsing tests passed"
exit 0
