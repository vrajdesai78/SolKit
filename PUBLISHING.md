# Publishing SolKit to npm

This guide covers the steps required to publish SolKit to the npm registry.

## Prerequisites

Before publishing, ensure you have:

1. An npm account - create one at [npmjs.com](https://www.npmjs.com/signup)
2. Logged in to npm via the terminal with `npm login`
3. All changes committed to your repository
4. Properly set the version in `package.json`

## Verifying Package Contents

The package includes:

- JavaScript source files: `dist/` directory
- Template files: `templates/` directory
- Documentation: `README.md` and `LICENSE`

## Publishing Steps

### 1. Prepare the package

Run the preparation script to verify everything is set up correctly:

```bash
npm run prepare-publish
```

This script will:
- Check for required files
- Verify package.json configuration
- Run a test build
- Provide publishing instructions

### 2. Update Version (if necessary)

For a new release, update the version in `package.json` following semantic versioning:
- **Patch** version (`0.1.0` → `0.1.1`) for bug fixes
- **Minor** version (`0.1.0` → `0.2.0`) for new features
- **Major** version (`0.1.0` → `1.0.0`) for breaking changes

### 3. Test the package

Make sure all tests pass:

```bash
npm test
```

### 4. Build the package

Build the production version:

```bash
npm run build
```

### 5. Pack the package (optional test)

Create a local tarball to verify package contents:

```bash
npm pack
```

This creates a `solkit-x.y.z.tgz` file which you can inspect to confirm the right files are included.

### 6. Publish the package

For the first public release:

```bash
npm publish --access public
```

For subsequent releases:

```bash
npm publish
```

For beta/preview releases:

```bash
npm publish --tag beta
```

### 7. Verify the published package

Check that your package is listed on npm:

```bash
npm view solkit
```

## After Publishing

1. Create a git tag for the release:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

2. Create a GitHub release with release notes
3. Update documentation as needed
4. Announce the release to your users

## Troubleshooting

### Package name already exists

If the package name `solkit` is already taken, you can:
- Choose a different name
- Use a scoped package name: `@yourscope/solkit`

### Updating a published package

If you need to update a package you've already published:
1. Make your changes
2. Increment the version in `package.json`
3. Run through the publishing steps again

### Unpublishing

npm only allows unpublishing within 72 hours of publishing. To unpublish:

```bash
npm unpublish solkit@1.0.0
```

Or remove all versions:

```bash
npm unpublish solkit --force
```

Note: Unpublishing is discouraged as it may break projects depending on your package. 