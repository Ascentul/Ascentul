#!/bin/bash

# Fix AI Coach userId conversions
echo "Fixing AI Coach userId handling..."

# Use sed to replace all instances where userId is used with storage functions
sed -i '' 's/storage.getAiCoachConversations(req.userId)/storage.getAiCoachConversations(parseInt(req.userId))/g' src/backend/routes/ai-coach.ts
sed -i '' 's/storage.createAiCoachConversation(req.userId/storage.createAiCoachConversation(parseInt(req.userId)/g' src/backend/routes/ai-coach.ts
sed -i '' 's/conversation.userId !== req.userId/conversation.userId !== parseInt(req.userId)/g' src/backend/routes/ai-coach.ts
sed -i '' 's/getUserContext(req.userId)/getUserContext(parseInt(req.userId))/g' src/backend/routes/ai-coach.ts

echo "AI Coach fixes complete."
