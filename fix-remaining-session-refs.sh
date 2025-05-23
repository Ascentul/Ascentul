#!/bin/bash

# Fix remaining session references in career-path.ts
echo "Fixing remaining session references in career-path.ts..."
sed -i '' 's/!req.session || !req.userId/!req.userId/g' src/backend/career-path.ts

# Fix remaining session references in user-role.ts
echo "Fixing remaining session references in user-role.ts..."
sed -i '' 's/!req.session || !req.userId/!req.userId/g' src/backend/routes/user-role.ts

# Fix remaining session references in ai-coach.ts
echo "Fixing remaining session references in ai-coach.ts..."
sed -i '' 's/!req.session || !req.userId/!req.userId/g' src/backend/routes/ai-coach.ts

# Clean up by renaming session-store.backup.ts to indicate it's deprecated
echo "Renaming session-store.backup.ts to indicate it's deprecated..."
mv src/backend/session-store.backup.ts src/backend/session-store.backup.deprecated.ts 2>/dev/null || echo "File already renamed"

echo "Running final check for any remaining session references..."
./check-session-refs.sh

echo "Supabase authentication migration complete."
