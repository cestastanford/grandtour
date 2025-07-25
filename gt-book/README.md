# gt-book

Once you have the .zip file "gt-book" follow the instructions from Giorgio:

'''
However, you will need to run a couple of commands to be able to run and see the website.

In theory, it should not take too long.. I will put some instructions below, but please let me know if you have issues or questions.

- If you don't have Jekyll installed, you should first install it. Jekyll requires Ruby... You can find info on how to install the whole thing here: https://jekyllrb.com/docs/installation/
- After that, you should be able to get into the folder I shared and run the following command:

bundle exec jekyll serve

This should start a server with the website running at http://localhost:4000/

The website contains very little real content but the structure and links should work.
'''

View the GitHub Pages site here: https://ryanctan.github.io/gt-book/.

Important dev note:
Much of the site links are hardcoded with a "/gt-book/" baseurl, which is necessary for the GitHub Pages site to work. This will need to be adapted for the final host.

## Setup

```bash
rbenv install 3.1.0
rbenv global 3.1.0
bundle install
bundle exec jekyll serve
```

Then open up http://localhost:4000/gt-book/.

## How to Deploy

How to deploy a static version of the website:

1. Run `bundle exec jekyll clean && bundle exec jekyll build --baseurl ""`
2. Copy the `_site` directory to the Grand Tour directory (https://github.com/cestastanford/grandtour) (`cp -r _site ../../`)
3. Commit and push changes

Alternatively, if you're running the website using Docker, use the following command to copy the built site out of the Docker container:

```bash
docker cp grandtour-app:/app/_site ../_site
```

This command copies the `/app/_site` directory from the `grandtour-app` container to the `../_site` directory in your local filesystem.
