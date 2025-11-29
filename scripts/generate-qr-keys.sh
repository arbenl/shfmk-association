#!/bin/bash
# This script generates a 2048-bit RSA key pair for QR code signing.

# Exit immediately if a command exits with a non-zero status.
set -e

# Create a directory for the keys if it doesn't exist.
mkdir -p keys

PRIVATE_KEY_FILE="keys/qr_private.pem"
PUBLIC_KEY_FILE="keys/qr_public.pem"

# Check if keys already exist
if [ -f "$PRIVATE_KEY_FILE" ]; then
    echo "✔ Key files already exist. Skipping generation."
    echo "  - Private key: $PRIVATE_KEY_FILE"
    echo "  - Public key:  $PUBLIC_KEY_FILE"
else
    # 1. Generate the RSA private key
    openssl genpkey -algorithm RSA -out "$PRIVATE_KEY_FILE" -pkeyopt rsa_keygen_bits:2048
    echo "✔ Generated private key: $PRIVATE_KEY_FILE"

    # 2. Extract the public key from the private key
    openssl rsa -pubout -in "$PRIVATE_KEY_FILE" -out "$PUBLIC_KEY_FILE"
    echo "✔ Extracted public key:  $PUBLIC_KEY_FILE"
fi

# 3. Format the keys for .env files
# Read the private key, escape newlines for .env
# This format is "value" which is compatible with most .env parsers.
PRIVATE_KEY_ENV=$(awk 'NF {printf "%s\n", $0}' "$PRIVATE_KEY_FILE")

# Read the public key, escape newlines for .env
PUBLIC_KEY_ENV=$(awk 'NF {printf "%s\n", $0}' "$PUBLIC_KEY_FILE")

# 4. Print instructions to the user
echo ""
echo "💡 Action Required: Add the following lines to your environment files."
echo "======================================================================"
echo ""
echo "1. For the web server (apps/web/.env.local):"
echo "------------------------------------------------"
echo "QR_PRIVATE_KEY_PEM=\"$PRIVATE_KEY_ENV\""
echo ""
echo "2. For the scanner app (apps/scanner/.env or EAS Secret):"
echo "--------------------------------------------------------"
echo "EXPO_PUBLIC_QR_PUBLIC_KEY_PEM=\"$PUBLIC_KEY_ENV\""
echo ""
echo "======================================================================"
echo "Remember to add keys/ and *.pem to your .gitignore file!"
echo ""
