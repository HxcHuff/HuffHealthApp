#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-/Users/david_huff}"
MODE="${2:---apply}"

if [[ "${MODE}" != "--apply" && "${MODE}" != "--dry-run" ]]; then
  echo "Usage: bash ./scripts/apply-netlify-deploy-gate-all-repos.sh [root_dir] [--apply|--dry-run]"
  exit 1
fi

IGNORE_LINE='  ignore = "bash ./scripts/netlify-ignore-unapproved.sh"'
DEPLOY_SCRIPT_CMD='bash ./scripts/netlify-deploy-approved.sh'

rewrite_netlify_toml() {
  local file="$1"
  local tmp
  tmp="$(mktemp)"

  awk -v ignore_line="${IGNORE_LINE}" '
    BEGIN {
      in_build=0
      inserted=0
      has_ignore=0
    }
    {
      if (in_build == 1 && $0 ~ /^[[:space:]]*ignore[[:space:]]*=/) {
        has_ignore=1
      }

      if ($0 ~ /^\[build\][[:space:]]*$/) {
        in_build=1
        print
        next
      }

      if (in_build == 1 && inserted == 0 && $0 ~ /^[[:space:]]*publish[[:space:]]*=/) {
        print
        if (has_ignore == 0) {
          print ignore_line
          inserted=1
        }
        next
      }

      if (in_build == 1 && inserted == 0 && $0 ~ /^\[/ && $0 !~ /^\[build\][[:space:]]*$/) {
        if (has_ignore == 0) {
          print ignore_line
          inserted=1
        }
        in_build=0
      }

      print
    }
    END {
      if (in_build == 1 && inserted == 0 && has_ignore == 0) {
        print ignore_line
      }
    }
  ' "${file}" > "${tmp}"

  if ! cmp -s "${file}" "${tmp}"; then
    mv "${tmp}" "${file}"
    return 0
  fi

  rm -f "${tmp}"
  return 1
}

apply_repo_changes() {
  local repo="$1"
  local changed=0

  mkdir -p "${repo}/scripts"

  cat > "${repo}/scripts/netlify-ignore-unapproved.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

if [[ "${NETLIFY_APPROVED_DEPLOY:-}" == "true" ]]; then
  echo "Approved deploy detected (NETLIFY_APPROVED_DEPLOY=true); build will proceed."
  exit 1
fi

echo "Skipping Netlify auto-deploy to reduce deploy spend."
echo "Set NETLIFY_APPROVED_DEPLOY=true for an approved deploy."
exit 0
EOF

  cat > "${repo}/scripts/netlify-deploy-approved.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" != "--approve" ]]; then
  echo "Refusing live deploy without explicit approval."
  echo "Usage: npm run deploy:live -- --approve"
  exit 1
fi

if ! command -v netlify >/dev/null 2>&1; then
  echo "Netlify CLI is not installed. Run: npm i -g netlify-cli"
  exit 1
fi

export NETLIFY_APPROVED_DEPLOY=true
echo "Running approved production deploy..."
netlify deploy --build --prod
EOF

  chmod +x "${repo}/scripts/netlify-ignore-unapproved.sh" "${repo}/scripts/netlify-deploy-approved.sh"

  if rewrite_netlify_toml "${repo}/netlify.toml"; then
    changed=1
  fi

  if node -e '
const fs = require("fs");
const p = process.argv[1];
const cmd = process.argv[2];
const raw = fs.readFileSync(p, "utf8");
const pkg = JSON.parse(raw);
pkg.scripts = pkg.scripts || {};
if (pkg.scripts["deploy:live"] === cmd) process.exit(10);
pkg.scripts["deploy:live"] = cmd;
fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + "\n");
' "${repo}/package.json" "${DEPLOY_SCRIPT_CMD}"; then
    changed=1
  else
    code=$?
    if [[ "${code}" -ne 10 ]]; then
      return "${code}"
    fi
  fi

  if [[ "${changed}" -eq 1 ]]; then
    return 0
  fi
  return 10
}

total_repos=0
eligible_repos=0
changed_repos=0
unchanged_repos=0
failed_repos=0

while IFS= read -r gitdir; do
  repo_dir="$(dirname "${gitdir}")"
  total_repos=$((total_repos + 1))

  if [[ ! -f "${repo_dir}/netlify.toml" || ! -f "${repo_dir}/package.json" ]]; then
    continue
  fi

  eligible_repos=$((eligible_repos + 1))

  if [[ "${MODE}" == "--dry-run" ]]; then
    echo "[DRY-RUN] ${repo_dir}"
    continue
  fi

  if apply_repo_changes "${repo_dir}"; then
    echo "[CHANGED] ${repo_dir}"
    changed_repos=$((changed_repos + 1))
  else
    code=$?
    if [[ "${code}" -eq 10 ]]; then
      echo "[UNCHANGED] ${repo_dir}"
      unchanged_repos=$((unchanged_repos + 1))
    else
      echo "[FAILED] ${repo_dir}"
      failed_repos=$((failed_repos + 1))
    fi
  fi
done < <(
  find "${ROOT_DIR}" \
    \( -path "*/node_modules/*" -o -path "*/.next/*" -o -path "*/Library/*" -o -path "*/.cache/*" \) -prune -o \
    -type d -name .git -print
)

echo
echo "Scan root: ${ROOT_DIR}"
echo "Git repos found: ${total_repos}"
echo "Eligible repos (netlify.toml + package.json): ${eligible_repos}"
if [[ "${MODE}" == "--apply" ]]; then
  echo "Changed repos: ${changed_repos}"
  echo "Unchanged repos: ${unchanged_repos}"
  echo "Failed repos: ${failed_repos}"
fi
