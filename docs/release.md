# KubeLB Dashboard Release

## Versioning

KubeLB Dashboard follows [Semantic Versioning](https://semver.org/). Each release is tagged with a version number in the format `vMAJOR.MINOR.PATCH`.

## Release Process

1. Create release branch from the main branch:

   ```bash
   git checkout -b release/vX.Y.Z
   ```

   In case of patch releases, this should already exist.

2. Create tag for the release:

   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   ```

3. Push the release branch and tag to the remote repository:

   ```bash
   git push origin release/vX.Y.Z
   git push origin vX.Y.Z
   ```

4. Create a release on GitHub:
   - Go to the "Releases" section of the repository.
   - Click "Draft a new release".
   - Select the tag you just pushed.
   - Fill in the release title and description, including any relevant changes or features.
   - Publish the release.
