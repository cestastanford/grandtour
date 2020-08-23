# Figures

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