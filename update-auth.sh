#!/bin/bash

# Update routes.ts
echo "Updating routes.ts..."
sed -i '' 's/req.session?.userId/req.userId/g' src/backend/routes.ts
sed -i '' 's/req.session.userId/req.userId/g' src/backend/routes.ts
sed -i '' 's/req.session && req.session.userId/req.userId/g' src/backend/routes.ts

# Update career-path.ts
echo "Updating career-path.ts..."
sed -i '' 's/req.session?.userId/req.userId/g' src/backend/career-path.ts
sed -i '' 's/req.session.userId/req.userId/g' src/backend/career-path.ts
sed -i '' 's/req.session && req.session.userId/req.userId/g' src/backend/career-path.ts
sed -i '' 's/!req.session || !req.session.userId/!req.userId/g' src/backend/career-path.ts

# Update user-role.ts
echo "Updating user-role.ts..."
sed -i '' 's/req.session?.userId/req.userId/g' src/backend/routes/user-role.ts
sed -i '' 's/req.session.userId/req.userId/g' src/backend/routes/user-role.ts
sed -i '' 's/req.session && req.session.userId/req.userId/g' src/backend/routes/user-role.ts
sed -i '' 's/!req.session || !req.session.userId/!req.userId/g' src/backend/routes/user-role.ts

# Update ai-coach.ts
echo "Updating ai-coach.ts..."
sed -i '' 's/req.session?.userId/req.userId/g' src/backend/routes/ai-coach.ts
sed -i '' 's/req.session.userId/req.userId/g' src/backend/routes/ai-coach.ts
sed -i '' 's/req.session && req.session.userId/req.userId/g' src/backend/routes/ai-coach.ts
sed -i '' 's/!req.session || !req.session.userId/!req.userId/g' src/backend/routes/ai-coach.ts

echo "Update complete."
