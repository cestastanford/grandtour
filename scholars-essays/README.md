# General

A major downside to the current implementation is the use of "/gt-book" in the links... ideally, baseurl would replace these. This is a temporary workaround so that the local and Github Pages environment are compatible.

For most questions, see the Sweet article for an example.

# Abstract, References, and About

Each .md file needs an "abstract" section at the top.

Near the end of article.html is a section involving page.references and page.about. I've decided to instead edit each .md file individually.
For references, just add a <h3> before the footnotes of the .md file. The about should be filled in later by editing the .md's about section
at the top. See Sweet article for example.

# Figures

We want some spacing between the main text and the figures. Put a <br> before and after the <figure> tag.

Links inside figure > figcaption don't work for some reason. Just use <a href> instead.
Neither does bolding as in **Fig. 1** or Italics as in _Explorer_. Use <b> and <i>.

Figures are originally encoded like:
    {figure-1}
This is replaced with something like:
    <a name="figure-1">
        <img src="figure-1.svg">
    </a>

.md files are pasted in directly OUTSIDE of the <figure> tag. Requires columns to have three hyphens, possibly add colons for alignment. Also requires blank line above heading. See sweet essay for example. Note: Copied table style from online, can be edited in _layout.scss

# Misc

Common UTF-8 Encoding Problems (https://www.i18nqa.com/debug/utf8-debug.html):

â€˜ -> ' (open)
â€™	-> ' (closed)
â€œ	-> " (open)
â€  -> " (closed)
â€” -> — (em dash)
Ã¡  -> á
Ã­   -> à, í