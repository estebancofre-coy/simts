#!/bin/bash
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
: "${VITE_API_URL:?Configura VITE_API_URL con la URL HTTPS del backend antes de desplegar.}"

repository=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
repository_name="${repository#*/}"
base_path="/$repository_name/"
if [[ "$repository_name" == *.github.io ]]; then
  base_path="/"
fi

(
  cd frontend
  npm ci
  npm test
  GITHUB_PAGES=true PAGES_BASE_PATH="$base_path" npm run build
)

index_file=$(mktemp)
rm "$index_file"
trap 'rm -f "$index_file"' EXIT
GIT_INDEX_FILE="$index_file" git add -f -- frontend/dist
build_tree=$(GIT_INDEX_FILE="$index_file" git write-tree)
site_tree=$(git rev-parse "$build_tree:frontend/dist")

parent=$(git ls-remote origin refs/heads/gh-pages | cut -f1)
parent_args=()
if [[ -n "$parent" ]]; then
  git fetch origin gh-pages
  parent_args=(-p "$(git rev-parse FETCH_HEAD)")
fi

source_commit=$(git rev-parse --short HEAD)
deployment_commit=$(
  printf 'deploy: publish frontend from %s\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>\n' "$source_commit" |
    git -c commit.gpgsign=false commit-tree "$site_tree" "${parent_args[@]}"
)
git push origin "$deployment_commit:refs/heads/gh-pages"
gh api --method PUT "repos/$repository/pages" \
  -f build_type=legacy -f 'source[branch]=gh-pages' -f 'source[path]=/'
gh api --method POST "repos/$repository/pages/builds"

echo "Frontend publicado desde $source_commit. Verifica el despliegue en GitHub Actions."
