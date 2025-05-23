#!/bin/bash

echo "Checking for remaining session references in the codebase..."

echo "\nChecking for req.session references:"
grep -r "req\.session" --include="*.ts" --include="*.js" src/

echo "\nChecking for express-session imports:"
grep -r "import.*session" --include="*.ts" --include="*.js" src/

echo "\nChecking for session-store references:"
grep -r "session-store" --include="*.ts" --include="*.js" src/

echo "\nChecking for sessionStore references:"
grep -r "sessionStore" --include="*.ts" --include="*.js" src/

echo "\nCheck complete."
