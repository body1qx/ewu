#!/bin/bash

# Script to check translation status of all pages

echo "=== Translation Status Report ==="
echo ""

pages=(
  "src/pages/Login.tsx"
  "src/pages/Register.tsx"
  "src/pages/Pending.tsx"
  "src/pages/Suspended.tsx"
  "src/pages/Profile.tsx"
  "src/pages/Notifications.tsx"
  "src/pages/KnowledgeBase.tsx"
  "src/pages/AIAssistant.tsx"
  "src/pages/Tools.tsx"
  "src/pages/Files.tsx"
  "src/pages/Schedules.tsx"
  "src/pages/FoodPoisoningCases.tsx"
  "src/pages/announcements/AnnouncementsPage.tsx"
  "src/pages/announcements/AnnouncementDetail.tsx"
  "src/pages/employee/AnnualLeave.tsx"
)

for page in "${pages[@]}"; do
  if [ -f "$page" ]; then
    filename=$(basename "$page")
    has_import=$(grep -c "useTranslation" "$page" 2>/dev/null || echo "0")
    t_count=$(grep -o "t(" "$page" 2>/dev/null | wc -l)
    hardcoded=$(grep -E '"[A-Z][a-z]+ [A-Z]|"[A-Z][a-z]+"|'"'"'[A-Z][a-z]+ [A-Z]|'"'"'[A-Z][a-z]+'"'"'' "$page" 2>/dev/null | wc -l)
    
    echo "📄 $filename"
    echo "   useTranslation: $has_import | t() calls: $t_count | Potential hardcoded: $hardcoded"
    echo ""
  fi
done

echo "=== End of Report ==="
