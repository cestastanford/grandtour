---
editor_options: 
  markdown: 
    wrap: 72
---

This document details instructions to make markdown files for the scholars' essays appear
properly on the website.

# General

Suggested order of operations for putting an essay into markdown:
- Copy in metadata (abstract, bio, etc.)
- Add necessary italicization in the metadata using <i> tags; bolding with <b> tags
- Copy in the text of the essay from the Word file. It will not be formatted properly
- Use "Find" and "Replace" to italicize Grand Tour Explorer, Explorer, and Dictionary
- Go through the entire essay text more slowly, adding reference numbers for notes (but not the note content itself)
- Add the contents from the endnotes of the Word file to the appropriate reference locations
- Add in the figures and their captions.
- Format the caption text (use <i> and <b> tags here, and <a href=" " target="_blank"> for hyperlinks).
- Add in any tables.
- Go through the essay text again adding hyperlinks to the GTE entries using the format: [Name](https://aworldmadebytravel.supdigital.org/explorer/#/entries/xxxx){:target="\_blank"}
- Add any additional links in the essay or notes, using the same format: [Link text](Hyperlink){:target="\_blank"}
  
For most questions, see the Macdonald essay for an example.

NB from Ryan: A major downside to the current implementation is the use of "/gt-book"
in the links... ideally, baseurl would replace these. This is a
temporary workaround so that the local and Github Pages environment are
compatible.

# Abstract, References, and About

Each .md file needs an "abstract" section at the top.

Near the end of article.html is a section involving page.references and
page.about. I've decided to instead edit each .md file individually. For
references, just add a

<h3>

before the footnotes of the .md file. The about should be filled in
later by editing the .md's about section at the top. See Sweet article
for example.

# Figures, Tables, and Links

Links inside figure \> figcaption don't work for some reason. Just use
<a href> instead. Neither does bolding as in **Fig. 1** or Italics as in
*Explorer*. Use <b> and <i>.

Figures are originally encoded like: {figure-1} This is replaced with
something like: <a name="figure-1"> <img src="../figure-1.svg"/> </a>

Tables as .md files are pasted in directly OUTSIDE of the <figure>
tag. Requires columns to have three hyphens, possibly add colons for
alignment. Also requires blank line above heading. See sweet essay for
example. Note: Copied table style from online, can be edited in
\_layout.scss

It is imperative that these tables are immediately preceded with an <a>
tag as in <a name="figure-5a">. This is so links-script.html numbers
paragraphs properly.

External links (Explorer and Book, but not figure links) need to open in
a new tab. Use this format: [text that appears in
body](link/to/book/or/explorer){:target="\_blank"}. Be sure to do this
for links inside <figcaption> elements as well!

Recall that Explorer links should only link the name of the traveler,
and not the parentheticals. 
NOT like this: 
[Robert Harvey's (1753-1820, travel year 1773, GTE 2294)](https://aworldmadebytravel.supdigital.org/explorer/#/entries/2294){:target="\_blank"} <!-- WRONG --> 
but instead like this: [Robert Harvey](https://aworldmadebytravel.supdigital.org/explorer/#/entries/2294){:target="\_blank"}'s
(1753-1820, travel year 1773, GTE 2294) <!-- RIGHT -->


To display TWO figures side by side, change BOTH of their corresponding <a> tag's class to half-fig, like so:
<a name="figure-1" class="half-fig">
and remove any <br> tags separating the images.
Accordingly, displaying THREE figures side by side requires the "third-fig" tag.


See the Sweet file for figure zoom functionality.

# Misc

Common UTF-8 Encoding Problems
(<https://www.i18nqa.com/debug/utf8-debug.html>):

HTML entity number for colon is &#58;
HTML entity number for em dash is &#8212;
In main text of essays, em dash is produced by three dashes (---)

â€˜ -\> ' (open) â€™ -\> ' (closed) â€œ -\> " (open) â€ -\> " (closed)
â€" -\> --- (em dash) Ã¡ -\> á Ã­ -\> à, í
