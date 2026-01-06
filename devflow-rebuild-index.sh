#!/bin/bash

# DevFlow - Rebuild Memory Index
# Scans project and rebuilds index.json for fast lookups

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MEMORY_DIR="$SCRIPT_DIR/.devflow/memory"
INDEX_FILE="$MEMORY_DIR/index.json"

echo "🔄 Rebuilding DevFlow Memory Index..."

# Initialize index structure
cat > "$INDEX_FILE" << 'EOF'
{
  "version": "1.0.0",
  "generated_at": "TIMESTAMP_PLACEHOLDER",
  "adrs": {},
  "stories": {},
  "snapshots": {},
  "agents": {},
  "tags": {}
}
EOF

# Update timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
sed -i.bak "s/TIMESTAMP_PLACEHOLDER/$TIMESTAMP/" "$INDEX_FILE"
rm -f "$INDEX_FILE.bak"

echo "  → Index structure created"

# Scan ADRs
if [ -d "$SCRIPT_DIR/docs/decisions" ]; then
  echo "  → Scanning ADRs..."
  # TODO: Parse ADR files and add to index
fi

# Scan Stories
if [ -d "$SCRIPT_DIR/docs/planning/stories" ]; then
  echo "  → Scanning user stories..."
  # TODO: Parse story files and add to index
fi

# Scan Snapshots
if [ -d "$SCRIPT_DIR/docs/snapshots" ]; then
  echo "  → Scanning snapshots..."
  # TODO: Parse snapshot files and add to index
fi

# Scan Agents
if [ -d "$SCRIPT_DIR/.devflow/agents" ]; then
  echo "  → Scanning agents..."
  # TODO: Parse agent metadata and add to index
fi

echo "✅ Index rebuilt successfully!"
echo "   File: $INDEX_FILE"
