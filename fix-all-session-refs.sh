#!/bin/bash

echo "Updating languages.ts..."
sed -i '' 's/req.session.userId/req.userId/g' src/backend/languages.ts
sed -i '' 's/req.session?.userId/req.userId/g' src/backend/languages.ts

echo "Updating skills.ts..."
sed -i '' 's/req.session.userId/req.userId/g' src/backend/skills.ts
sed -i '' 's/req.session?.userId/req.userId/g' src/backend/skills.ts

echo "Updating routes/projects.ts..."
sed -i '' 's/req.session.userId/req.userId/g' src/backend/routes/projects.ts
sed -i '' 's/req.session?.userId/req.userId/g' src/backend/routes/projects.ts

echo "Updating routes/jobs-ai.ts..."
sed -i '' 's/!req.session || !req.session.userId/!req.userId/g' src/backend/routes/jobs-ai.ts
sed -i '' 's/req.session!.userId/req.userId/g' src/backend/routes/jobs-ai.ts

echo "Updating routes/academic-programs.ts..."
sed -i '' 's/!req.session || !req.session.userId/!req.userId/g' src/backend/routes/academic-programs.ts
sed -i '' 's/req.session.userId/req.userId/g' src/backend/routes/academic-programs.ts

echo "Updating routes/university-invites.ts..."
sed -i '' 's/req.session?.userId/req.userId/g' src/backend/routes/university-invites.ts
sed -i '' 's/req.session.userId/req.userId/g' src/backend/routes/university-invites.ts

echo "Updating routes/jobs.ts..."
sed -i '' 's/req.session.userId/req.userId/g' src/backend/routes/jobs.ts

echo "Updating routes/applications.ts..."
sed -i '' 's/req.session.userId/req.userId/g' src/backend/routes/applications.ts

echo "Updating routes/universities.ts..."
sed -i '' 's/req.session?.userId/req.userId/g' src/backend/routes/universities.ts
sed -i '' 's/req.session.userId/req.userId/g' src/backend/routes/universities.ts

echo "Updating routes/application-interview.ts..."
sed -i '' 's/req.session.userId/req.userId/g' src/backend/routes/application-interview.ts

echo "Updating career-data.ts..."
sed -i '' 's/!req.session.userId/!req.userId/g' src/backend/career-data.ts
sed -i '' 's/req.session.userId/req.userId/g' src/backend/career-data.ts

echo "Update complete."
