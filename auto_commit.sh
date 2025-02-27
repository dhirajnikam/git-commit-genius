#!/bin/bash
###############################################################################
# auto_commit.sh
# ----------------------------------------------------------------------------
# This script automates git commits using the Gemini API and Conventional Commits.
###############################################################################

GEMINI_API_URL="https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent"
API_KEY="$1"  # API key passed as an argument
VALID_PREFIXES=("feat" "fix" "docs" "style" "refactor" "perf" "test" "chore" "ci")

if [ -z "$API_KEY" ]; then
    echo "Error: Gemini API key is required."
    exit 1
fi

files=$(git ls-files --modified --others --deleted --exclude-standard)
if [ -z "$files" ]; then
    echo "No changes to commit."
    exit 0
fi

get_commit_message_from_gemini() {
    local diff_summary="$1"
    local prompt="Generate a concise, one-line commit message with a Conventional Commit prefix from [${VALID_PREFIXES[*]}] based on these file changes:
$diff_summary"
    prompt=$(echo "$prompt" | tr '\n' ' ' | sed 's/"/\\"/g')

    local response
    response=$(curl -s -X POST "$GEMINI_API_URL?key=$API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
              \"contents\": [
                {
                  \"parts\": [
                    {
                      \"text\": \"$prompt\"
                    }
                  ]
                }
              ]
            }")

    echo "$response" | grep -o '"text": *"[^"]*"' | sed -E 's/.*"text": *"([^"]*)".*/\1/' | tr -d '\n'
}

sanitize_commit_message() {
    local ai_message="$1"
    ai_message=$(echo "$ai_message" | sed 's/^ *//;s/ *$//')
    local lower_msg=$(echo "$ai_message" | tr '[:upper:]' '[:lower:]')
    local chosen_prefix="refactor"
    for prefix in "${VALID_PREFIXES[@]}"; do
        if [[ "$lower_msg" =~ ^$prefix ]]; then
            chosen_prefix="$prefix"
            ai_message=$(echo "$ai_message" | sed -E "s/^$prefix[!:[:space:]]*//i")
            break
        fi
    done
    echo "$chosen_prefix: $ai_message"
}

for file in $files; do
    diff_summary="Changes for file '$file':"

    if git ls-files --deleted | grep -q "$file"; then
        diff_summary+=" [Deleted] $file."
        git rm --cached -- "$file" 2>/dev/null || true
    elif git ls-files --others --exclude-standard | grep -q "$file"; then
        diff_summary+=" [New] $file content: $(cat "$file" 2>/dev/null)."
        git add "$file" 2>/dev/null || true
    else
        diff_out=$(git diff "$file")
        if [ -n "$diff_out" ]; then
            diff_summary+=" [Modified] $file diff: $diff_out"
        fi
        git add "$file" 2>/dev/null || true
    fi

    ai_response=$(get_commit_message_from_gemini "$diff_summary")
    if [ -z "$ai_response" ]; then
        echo "Skipping commit for '$file'. No AI response."
        git restore --staged "$file" 2>/dev/null || true
        continue
    fi

    final_commit_message=$(sanitize_commit_message "$ai_response")
    git commit -m "$final_commit_message" >/dev/null 2>&1 || true
    echo "Committed '$file' with message: $final_commit_message"
done

echo -e "\n=========== Commit Summary ==========="
git log --oneline -n $(echo "$files" | wc -w)
echo "======================================"