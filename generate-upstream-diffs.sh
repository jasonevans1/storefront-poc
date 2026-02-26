#!/bin/bash

# Generate diffs for locally modified files between origin/main and upstream/main
# Uses modified-files.txt output from sync-upstream.sh

set -e

UPSTREAM_BRANCH="upstream/b2b"
LOCAL_BRANCH="origin/main"
INPUT_FILE="modified-files.txt"
OUTPUT_DIR="upstream-diffs"

if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: $INPUT_FILE not found. Run sync-upstream.sh first."
    exit 1
fi

# Ensure we have latest refs
echo "Fetching latest refs..."
git fetch upstream
git fetch origin

# Create output directory
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Combined diff file
COMBINED_DIFF="$OUTPUT_DIR/all-changes.diff"
> "$COMBINED_DIFF"

FILE_COUNT=0
SKIPPED=()

while IFS= read -r file; do
    [ -z "$file" ] && continue

    LOCAL_EXISTS=$(git cat-file -e "$LOCAL_BRANCH:$file" 2>/dev/null && echo "yes" || echo "no")
    UPSTREAM_EXISTS=$(git cat-file -e "$UPSTREAM_BRANCH:$file" 2>/dev/null && echo "yes" || echo "no")

    if [ "$LOCAL_EXISTS" = "no" ] && [ "$UPSTREAM_EXISTS" = "no" ]; then
        SKIPPED+=("$file (not found in either branch)")
        continue
    fi

    # Generate diff (local on left, upstream on right)
    # Shows what upstream changed relative to local
    DIFF=$(git diff "$LOCAL_BRANCH:$file" "$UPSTREAM_BRANCH:$file" 2>/dev/null || true)

    if [ -z "$DIFF" ]; then
        SKIPPED+=("$file (no differences)")
        continue
    fi

    # Write individual diff file
    DIFF_FILE="$OUTPUT_DIR/$(echo "$file" | tr '/' '_').diff"
    echo "$DIFF" > "$DIFF_FILE"

    # Append to combined diff
    echo "================================================================================" >> "$COMBINED_DIFF"
    echo "File: $file" >> "$COMBINED_DIFF"
    echo "  Local:    $LOCAL_BRANCH:$file" >> "$COMBINED_DIFF"
    echo "  Upstream: $UPSTREAM_BRANCH:$file" >> "$COMBINED_DIFF"
    echo "================================================================================" >> "$COMBINED_DIFF"
    echo "$DIFF" >> "$COMBINED_DIFF"
    echo "" >> "$COMBINED_DIFF"

    FILE_COUNT=$((FILE_COUNT + 1))
    echo "  Diffed: $file"
done < "$INPUT_FILE"

echo ""
echo "=== SUMMARY ==="
echo "Diffs generated: $FILE_COUNT"
echo "Skipped: ${#SKIPPED[@]}"

if [ ${#SKIPPED[@]} -gt 0 ]; then
    echo ""
    echo "Skipped files:"
    for s in "${SKIPPED[@]}"; do
        echo "  - $s"
    done
fi

echo ""
echo "Output:"
echo "  Combined diff: $COMBINED_DIFF"
echo "  Individual diffs: $OUTPUT_DIR/"
echo ""
echo "View combined diff: less $COMBINED_DIFF"
