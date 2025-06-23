Quick steps to deploy:

1. Run steps in `ARCHIVE-REPRODUCE.md`
2. Run:

```
cd gt-book
docker cp grandtour-app:/app/_site ../_site
```

3. Push to master

4. Wait for GitHub Actions to deploy; it should push to the `build` branch.

5. Go to Reclaim and re-deploy from the `build` branch