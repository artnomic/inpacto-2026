#!/bin/bash
# ─────────────────────────────────────────────────────────────
# deploy.sh — GitHub push + Vercel deploy para inpacto-2026
# Execute: bash deploy.sh
# ─────────────────────────────────────────────────────────────

set -e
cd "$(dirname "$0")"

echo ""
echo "🚀 inpacto-2026 — GitHub + Vercel deploy"
echo "─────────────────────────────────────────"

# ── 1. LIMPAR .git quebrado do sandbox (se existir) ──────────
if [ -d ".git" ]; then
  echo "🧹 Removendo .git anterior (criado pelo sandbox)..."
  rm -rf .git
fi

# ── 2. GIT INIT ───────────────────────────────────────────────
echo "📦 Inicializando repositório git..."
git init
git branch -M main

# ── 3. CONFIGURAR USUÁRIO ─────────────────────────────────────
git config user.name "Giovanna Berson"
git config user.email "giovannaberson@gmail.com"

# ── 4. PEDIR URL DO REPOSITÓRIO GITHUB ───────────────────────
GITHUB_URL="https://github.com/artnomic/inpacto-2026"
echo "🔗 Repositório: $GITHUB_URL"
git remote add origin "$GITHUB_URL"

# ── 5. COMMIT INICIAL ─────────────────────────────────────────
echo ""
echo "📝 Criando commit..."
git add -A
git commit -m "feat: performance, encoding fixes, load test optimizations

- Fix character encoding in all bottom sheets and ProfileSetupScreen
- Add 11 missing FK indexes across all tables
- Fix 20 RLS policies: auth.uid() → (select auth.uid())
- Remove redundant avatar query in getRanking (view already has avatar_url)
- Add xp DESC index on profiles for ranking window function
- Persist eventConfig + sessions in Zustand localStorage cache
- Skip re-fetching static event data on reload; refresh lazily in background"

# ── 6. PUSH PARA GITHUB ───────────────────────────────────────
echo ""
echo "⬆️  Fazendo push para GitHub..."
git push -u origin main

echo ""
echo "✅ Código enviado para o GitHub!"

# ── 7. VERCEL DEPLOY ─────────────────────────────────────────
echo ""
echo "─────────────────────────────────────────"
echo "🔺 Iniciando deploy no Vercel..."

if ! command -v vercel &> /dev/null; then
  echo "⚠️  Vercel CLI não encontrado. Instalando..."
  npm install -g vercel
fi

vercel --prod

echo ""
echo "✅ Deploy concluído!"
echo "─────────────────────────────────────────"
