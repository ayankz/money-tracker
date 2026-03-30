#!/bin/bash

echo "🎣 Installing Husky and Git Hooks..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional prettier

echo ""
echo -e "${BLUE}⚙️  Initializing Husky...${NC}"
npm run prepare

echo ""
echo -e "${BLUE}🔐 Making hooks executable...${NC}"
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push

echo ""
echo -e "${GREEN}✅ Husky setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run format' to format all files"
echo "  2. Run 'npm run lint:fix' to fix linting issues"
echo "  3. Try making a commit to test the hooks"
echo ""
echo "See SETUP-HUSKY.md for more details"
