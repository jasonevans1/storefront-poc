#!/bin/bash

# Sync script to pull upstream changes for unmodified files
# This script copies files from upstream/main that haven't been changed locally

set -e

AUTO_YES=false
for arg in "$@"; do
    case "$arg" in
        --yes|-y) AUTO_YES=true ;;
    esac
done

UPSTREAM_BRANCH="upstream/b2b"
LOCAL_BRANCH="origin/main"
TEMP_DIR=$(mktemp -d)

echo "=== Upstream Sync Script ==="
echo "Comparing $LOCAL_BRANCH with $UPSTREAM_BRANCH"
echo ""

# Ensure we have latest upstream
echo "Fetching upstream..."
git fetch upstream

# Get list of all files in upstream
echo "Analyzing files..."
UPSTREAM_FILES=$(git ls-tree -r --name-only $UPSTREAM_BRANCH)

# Arrays to track files
COPIED_FILES=()
MODIFIED_FILES=()
NEW_FILES=()
DELETED_FILES=()

# Check each upstream file
while IFS= read -r file; do
    # Check if file exists in local branch
    if git ls-tree -r --name-only $LOCAL_BRANCH | grep -Fx "$file" > /dev/null 2>&1; then
        # File exists locally - check if it's been modified
        # Compare file content between local and upstream
        LOCAL_HASH=$(git rev-parse "$LOCAL_BRANCH:$file" 2>/dev/null || echo "")
        UPSTREAM_HASH=$(git rev-parse "$UPSTREAM_BRANCH:$file" 2>/dev/null || echo "")
        
        if [ "$LOCAL_HASH" != "$UPSTREAM_HASH" ]; then
            # File is different - check if we have local commits on it
            # by checking if the file exists in the initial commit
            INITIAL_COMMIT=$(git rev-list --max-parents=0 HEAD)
            INITIAL_HASH=$(git rev-parse "$INITIAL_COMMIT:$file" 2>/dev/null || echo "NOFILE")
            
            if [ "$INITIAL_HASH" = "NOFILE" ] || [ "$LOCAL_HASH" != "$INITIAL_HASH" ]; then
                # File has been modified locally
                MODIFIED_FILES+=("$file")
            else
                # File hasn't been modified locally, safe to copy
                COPIED_FILES+=("$file")
            fi
        fi
    else
        # New file in upstream
        NEW_FILES+=("$file")
        COPIED_FILES+=("$file")
    fi
done <<< "$UPSTREAM_FILES"

# Check for files deleted in upstream
LOCAL_FILES=$(git ls-tree -r --name-only $LOCAL_BRANCH)
while IFS= read -r file; do
    if ! git ls-tree -r --name-only $UPSTREAM_BRANCH | grep -Fx "$file" > /dev/null 2>&1; then
        DELETED_FILES+=("$file")
    fi
done <<< "$LOCAL_FILES"

# Display summary
echo ""
echo "=== SUMMARY ==="
echo "Files to copy from upstream: ${#COPIED_FILES[@]}"
echo "Files modified locally (manual review needed): ${#MODIFIED_FILES[@]}"
echo "Files deleted in upstream: ${#DELETED_FILES[@]}"
echo ""

# Ask for confirmation
if [ ${#COPIED_FILES[@]} -eq 0 ]; then
    echo "No files to copy. Exiting."
    exit 0
fi

if [ "$AUTO_YES" = false ]; then
    read -p "Copy ${#COPIED_FILES[@]} unmodified files from upstream? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        rm -rf "$TEMP_DIR"
        exit 0
    fi
else
    echo "Auto-confirming copy of ${#COPIED_FILES[@]} files (--yes flag)"
fi

# Copy files
echo ""
echo "Copying files..."
for file in "${COPIED_FILES[@]}"; do
    # Create directory if needed
    mkdir -p "$(dirname "$file")"
    
    # Copy file from upstream
    git show "$UPSTREAM_BRANCH:$file" > "$file"
    echo "  Copied: $file"
done

echo ""
echo "=== FILES COPIED (${#COPIED_FILES[@]}) ==="
printf '%s\n' "${COPIED_FILES[@]}"

# Save modified files list
if [ ${#MODIFIED_FILES[@]} -gt 0 ]; then
    echo ""
    echo "=== FILES MODIFIED LOCALLY - MANUAL REVIEW NEEDED (${#MODIFIED_FILES[@]}) ==="
    printf '%s\n' "${MODIFIED_FILES[@]}" | tee modified-files.txt
    echo ""
    echo "List saved to: modified-files.txt"
fi

# Save deleted files list
if [ ${#DELETED_FILES[@]} -gt 0 ]; then
    echo ""
    echo "=== FILES DELETED IN UPSTREAM (${#DELETED_FILES[@]}) ==="
    printf '%s\n' "${DELETED_FILES[@]}" | tee deleted-files.txt
    echo ""
    echo "List saved to: deleted-files.txt"
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "=== DONE ==="
echo "Review the changes with: git status"
echo "Review diffs with: git diff"
echo "Commit when ready: git add . && git commit -m 'sync: pull upstream changes'"
