# Deployment Guide

This guide explains how to set up and use the automated CI/CD pipeline for publishing the `pieui` package to npm.

## Prerequisites

### 1. NPM Account and Token

1. Create an account on [npmjs.com](https://www.npmjs.com) if you don't have one
2. Generate an access token:
   - Go to your npm profile settings
   - Navigate to "Access Tokens"
   - Click "Generate New Token"
   - Choose "Automation" token type
   - Copy the token (you'll need it for GitHub)

### 2. GitHub Repository Secrets

Add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Click on "Settings" tab
3. Navigate to "Secrets and variables" → "Actions"
4. Add these secrets:

   - **`NPM_TOKEN`**: Your npm automation token
   - **`GITHUB_TOKEN`**: Automatically provided by GitHub (no action needed)

## How the CI/CD Works

### Continuous Integration (CI)
- Runs on every push to `main` or `develop` branches
- Runs on every pull request
- Tests the build process
- Performs type checking
- Verifies all required files are generated

### Continuous Deployment (CD)
- Triggers only when you push a git tag starting with `v` (e.g., `v1.0.0`)
- Builds the package
- Updates package.json version
- Publishes to npm
- Creates a GitHub release

## Release Process

### Method 1: Using npm version commands (Recommended)

```bash
# For patch releases (1.0.0 → 1.0.1)
bun run release:patch

# For minor releases (1.0.0 → 1.1.0)
bun run release:minor

# For major releases (1.0.0 → 2.0.0)
bun run release:major
```

These commands will:
1. Update the version in package.json
2. Create a git commit with the version change
3. Create a git tag
4. Push the changes and tag to GitHub
5. Trigger the automated deployment

### Method 2: Manual tagging

```bash
# Update version in package.json manually
npm version 1.2.3 --no-git-tag-version

# Commit the change
git add package.json
git commit -m "Release v1.2.3"

# Create and push tag
git tag v1.2.3
git push origin main
git push origin v1.2.3
```

## Workflow Details

### Files Involved
- `.github/workflows/ci.yml` - Continuous Integration
- `.github/workflows/publish.yml` - Publishing workflow

### What Gets Published
- `dist/index.js` - CommonJS build
- `dist/index.esm.js` - ESM build
- `dist/index.d.ts` - TypeScript definitions
- All files in `dist/` directory

### Package Verification
The workflow verifies:
- All required build files exist
- TypeScript compilation succeeds
- Package can be built successfully

## Troubleshooting

### Common Issues

1. **NPM_TOKEN not working**
   - Ensure the token has "Automation" permissions
   - Check if the token hasn't expired
   - Verify the secret name is exactly `NPM_TOKEN`

2. **Version conflicts**
   - Make sure the version doesn't already exist on npm
   - Use semantic versioning (semver)

3. **Build failures**
   - Check the CI workflow for specific errors
   - Ensure all dependencies are properly listed
   - Run `bun run build` locally to test

### Testing the Workflow

Before your first release, you can:

1. Test the build locally:
   ```bash
   bun run build
   npm pack  # Creates a .tgz file to verify package contents
   ```

2. Test with a pre-release version:
   ```bash
   npm version 1.0.0-beta.1
   git tag v1.0.0-beta.1
   git push origin v1.0.0-beta.1
   ```

## Security Notes

- Never commit npm tokens to your repository
- Use GitHub secrets for sensitive information
- The workflow uses npm provenance for enhanced security
- Builds are isolated and run in clean environments

## First Release Checklist

- [ ] Set up npm account
- [ ] Generate npm automation token
- [ ] Add NPM_TOKEN to GitHub secrets
- [ ] Test local build: `bun run build`
- [ ] Commit all changes
- [ ] Run first release: `bun run release:patch`
- [ ] Verify package appears on npmjs.com
- [ ] Test installation: `npm install pieui`