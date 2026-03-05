# Using GitHub Package Registry for Private Nuxt Modules

## Same Registry, Better Experience

The beautiful thing is you can use your **existing GitHub Package Registry setup** for Nuxt modules!

## Setting Up Your Organization

### 1. Organization .npmrc

```bash
# .npmrc (in your project root)
@your-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### 2. GitHub Actions (Same as before!)

```yaml
# .github/workflows/publish-modules.yml
name: Publish Modules

on:
    push:
        branches: [main]
        paths:
            - 'modules/**'

jobs:
    publish:
        runs-on: ubuntu-latest
        permissions:
            contents: read
            packages: write

        steps:
            - uses: actions/checkout@v3

            - uses: actions/setup-node@v3
              with:
                  node-version: 18
                  registry-url: https://npm.pkg.github.com/
                  scope: '@your-org'

            - name: Build and Publish Modules
              env:
                  NODE_AUTH_TOKEN: ${{secrets.GITHUB_TOKEN}}
              run: |
                  for module in modules/*; do
                    if [ -d "$module" ]; then
                      echo "Publishing $module"
                      cd $module
                      npm ci
                      npm run build
                      npm publish
                      cd ../..
                    fi
                  done
```

## Module Package Structure

```json
// @your-org/aether-doom-module/package.json
{
    "name": "@your-org/aether-doom-module",
    "version": "1.0.0",
    "private": false, // Can be published to GitHub registry

    // GitHub Registry configuration
    "publishConfig": {
        "registry": "https://npm.pkg.github.com",
        "@your-org:registry": "https://npm.pkg.github.com"
    },

    // Repository info for GitHub Packages
    "repository": {
        "type": "git",
        "url": "git+https://github.com/your-org/aether-modules.git",
        "directory": "modules/doom"
    }
}
```

## Installation in Apps

### For Developers:

```bash
# Set up auth (one time)
npm login --registry=https://npm.pkg.github.com --scope=@your-org

# Install private modules
npm install @your-org/aether-doom-module
npm install @your-org/aether-events-module
```

### In CI/CD:

```yaml
- name: Install dependencies
  env:
      NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
      echo "@your-org:registry=https://npm.pkg.github.com" >> ~/.npmrc
      echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" >> ~/.npmrc
      npm ci
```

## Monorepo Structure (Optional)

```
your-org/aether-modules/
├── .github/
│   └── workflows/
│       └── publish.yml
├── modules/
│   ├── doom/
│   │   ├── package.json      # @your-org/aether-doom
│   │   └── src/
│   ├── events/
│   │   ├── package.json      # @your-org/aether-events
│   │   └── src/
│   └── entity-lookup/
│       ├── package.json      # @your-org/aether-entity-lookup
│       └── src/
└── package.json              # Workspace root
```

### Workspace Root package.json:

```json
{
    "name": "@your-org/aether-modules",
    "private": true,
    "workspaces": ["modules/*"],
    "scripts": {
        "build": "npm run build --workspaces",
        "publish-all": "npm publish --workspaces"
    }
}
```

## Security & Access

### Same as your current setup:

- ✅ Private to your organization
- ✅ Read access for org members
- ✅ Write access for maintainers
- ✅ Token-based CI/CD
- ✅ Scoped packages prevent conflicts

### Package Visibility:

```bash
# Make package visible to org only (not public npm)
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /orgs/YOUR_ORG/packages/npm/PACKAGE_NAME/visibility \
  -f visibility='private'
```

## Migration Checklist

- [ ] Keep existing GitHub Package Registry setup
- [ ] Create Nuxt module wrapper for one feature
- [ ] Publish to same @your-org scope
- [ ] Test installation in app
- [ ] Update CI/CD if needed
- [ ] Migrate remaining modules
- [ ] Celebrate! 🎉

## The Best Part

Your team already knows how to:

- Authenticate with GitHub packages ✅
- Publish to your org registry ✅
- Install private packages ✅
- Manage permissions ✅

**Nothing changes except the module structure!**

Instead of:

- Regular npm package → manual registration in 4 places

You get:

- Nuxt module package → auto-registration in 1 place

Same registry. Same auth. Same workflow. Just better. 🚀
