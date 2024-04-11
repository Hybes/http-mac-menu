#!/bin/bash

# Path to the package.json file
PACKAGE_JSON="./package.json"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq could not be found. Please install jq to continue."
    exit 1
fi

# Extract the version from the package.json file
if [[ -f "$PACKAGE_JSON" ]]; then
    VERSION=$(jq -r '.version' "$PACKAGE_JSON")
else
    echo "package.json not found. Make sure you are in the correct directory."
    exit 1
fi

# The source directory
SOURCE_DIR="dist"

# The destination in MinIO where you want to copy files
DEST="myminio/hybes"

# Loop through all .dmg and .zip files within dist/ containing the version number
shopt -s nullglob
for file in "$SOURCE_DIR"/HTTP\ Mac\ Menu-"$VERSION"*.dmg "$SOURCE_DIR"/HTTP\ Mac\ Menu-"$VERSION"*.zip; do
    echo "Copying $file to $DEST..."
    # Use the mc cp command to copy the file to MinIO
    mc cp "$file" "$DEST"/
done
shopt -u nullglob

echo "All version $VERSION files have been copied to MinIO."