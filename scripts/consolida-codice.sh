#!/bin/bash

echo "=== CONSOLIDAMENTO CODICE ==="
echo ""

# Verifica stato git
echo "📋 Verifico stato repository..."
git_status=$(git status --porcelain)

if [ -z "$git_status" ]; then
    echo "✅ Nessuna modifica da consolidare"
    exit 0
fi

echo ""
echo "📝 File modificati:"
git status -s
echo ""

# Aggiungi tutti i file
echo "➕ Aggiungo tutti i file al commit..."
git add -A

# Crea messaggio di commit con timestamp
timestamp=$(date +"%Y-%m-%d %H:%M")
commit_message="Consolidamento codice - $timestamp

Modifiche automatiche consolidate:
$(git diff --cached --name-status | sed 's/^/- /')

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Esegui commit
echo ""
echo "💾 Creo commit..."
git commit -m "$commit_message"

if [ $? -eq 0 ]; then
    echo ""
    echo "📤 Push su origin..."
    current_branch=$(git branch --show-current)
    git push origin "$current_branch"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Codice consolidato con successo!"
        echo "   Branch: $current_branch"
        echo "   Ultimo commit: $(git log -1 --oneline)"
    else
        echo ""
        echo "❌ Errore durante il push"
        exit 1
    fi
else
    echo ""
    echo "❌ Errore durante il commit"
    exit 1
fi