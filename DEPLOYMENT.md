Quick steps to deploy:

1. Run steps in `ARCHIVE-REPRODUCE.md`
2. Run:

```
cd gt-book
docker cp grandtour-app:/app/_site ../_site
cd _site
find . -type f \( -name "*.html" -o -name "*.md" -o -name "*.js" -o -name "*.pug" \) -print0 | \
    xargs -0 sed -i '' "s|http://localhost:5100|https://aworldmadebytravel.supdigital.org|g"
```

3. Push to master

4. Wait for GitHub Actions to deploy; it should push to the `build` branch.

5. Go to Reclaim and re-deploy from the `build` branch. You can do this by SSH'ing into the application server and running a `git pull`.