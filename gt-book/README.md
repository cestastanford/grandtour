# gt-book

Setup:

```
export JEKYLL_VERSION=3.8
docker run \
  -p 4000:4000 --expose=4000 \
  --volume="$PWD:/srv/jekyll:Z" \
  -it jekyll/jekyll:$JEKYLL_VERSION \
  jekyll serve --incremental
```

This should start a server with the website running at http://localhost:4000/gt-book/.