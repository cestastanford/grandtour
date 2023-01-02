import { parseFootnotes } from "../pub/entry/entry-transformation";

describe("test footnotes", () => {
  test("after semicolon", () => {
    expect(parseFootnotes("Fact 1;1 he was good.", ["test"]))
      .toMatchInlineSnapshot(`
"Fact 1;<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-1\\">[1]</sup> he was good.
            <div style='display: none' id=\\"gte-footnote-1\\">test</div>
        "
`);
  });
  test("after letter and semicolon", () => {
    expect(parseFootnotes("Fact true;1 he was good.", ["test"]))
      .toMatchInlineSnapshot(`
"Fact true;<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-1\\">[1]</sup> he was good.
            <div style='display: none' id=\\"gte-footnote-1\\">test</div>
        "
`);
  });
  test("after parenthesis and semicolon", () => {
    expect(parseFootnotes("Fact true);1 he was good.", ["test"]))
      .toMatchInlineSnapshot(`
"Fact true);<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-1\\">[1]</sup> he was good.
            <div style='display: none' id=\\"gte-footnote-1\\">test</div>
        "
`);
  });
  test("after period", () => {
    expect(parseFootnotes("Fact 1.1 he was good.", ["test"]))
      .toMatchInlineSnapshot(`
"Fact 1.<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-1\\">[1]</sup> he was good.
            <div style='display: none' id=\\"gte-footnote-1\\">test</div>
        "
`);
  });
  test("after comma", () => {
    expect(parseFootnotes("Fact 1,1 he was good.", ["test"]))
      .toMatchInlineSnapshot(`
"Fact 1,<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-1\\">[1]</sup> he was good.
            <div style='display: none' id=\\"gte-footnote-1\\">test</div>
        "
`);
  });
  test("parse manual", () => {
    expect(parseFootnotes("{1}", ["test"])).toMatchInlineSnapshot(`
"<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-1\\">[1]</sup>
            <div style='display: none' id=\\"gte-footnote-1\\">test</div>
        "
`);
  });
  test("parse manual at end of sentence", () => {
    expect(parseFootnotes("Fact 1.{1} he was good.", ["test"]))
      .toMatchInlineSnapshot(`
"Fact 1.<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-1\\">[1]</sup> he was good.
            <div style='display: none' id=\\"gte-footnote-1\\">test</div>
        "
`);
  });
  test("parse manual at end of word", () => {
    expect(parseFootnotes("abc{1} he was good.", ["test"]))
      .toMatchInlineSnapshot(`
"abc<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-1\\">[1]</sup> he was good.
            <div style='display: none' id=\\"gte-footnote-1\\">test</div>
        "
`);
  });
  test("parse manual at end of number", () => {
    expect(parseFootnotes("in 1975{1} he was good.", ["test"]))
      .toMatchInlineSnapshot(`
"in 1975<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-1\\">[1]</sup> he was good.
            <div style='display: none' id=\\"gte-footnote-1\\">test</div>
        "
`);
  });
  test("parse manual at end of number 2", () => {
    expect(
      parseFootnotes(
        "visits to Naples in March 1760{3} and Florence in August 1761.4 ",
        ["test", "two", "three", "four"]
      )
    ).toMatchInlineSnapshot(`
"visits to Naples in March 1760<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-3\\">[3]</sup> and Florence in August 1761.<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-4\\">[4]</sup> 
            <div style='display: none' id=\\"gte-footnote-3\\">3. three</div>
        
            <div style='display: none' id=\\"gte-footnote-4\\">4. four</div>
        "
`);
  });
  test("parse double quotes", () => {
    expect(parseFootnotes('hello."1 w', ["test"])).toMatchInlineSnapshot(`
"hello.\\"<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-1\\">[1]</sup> w
            <div style='display: none' id=\\"gte-footnote-1\\">test</div>
        "
`);
  });
  test("parse single quotes", () => {
    expect(parseFootnotes("hello.'1 w", ["test"])).toMatchInlineSnapshot(`
"hello.'<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-1\\">[1]</sup> w
            <div style='display: none' id=\\"gte-footnote-1\\">test</div>
        "
`);
  });
  test("parse single quotes with period after", () => {
    expect(parseFootnotes("than the Algerines'.1 w", ["test"]))
      .toMatchInlineSnapshot(`
"than the Algerines'.<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-1\\">[1]</sup> w
            <div style='display: none' id=\\"gte-footnote-1\\">test</div>
        "
`);
  });
  test("don't parse number following beginning of quote", () => {
    expect(
      parseFootnotes('"1 person did this!"', ["test"])
    ).toMatchInlineSnapshot(`"\\"1 person did this!\\""`);
  });
  test("parse number following end of word", () => {
    expect(parseFootnotes("hello1 he was good", ["test"]))
      .toMatchInlineSnapshot(`
"hello<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-1\\">[1]</sup> he was good
            <div style='display: none' id=\\"gte-footnote-1\\">test</div>
        "
`);
  });
  test("don't parse euros", () => {
    expect(parseFootnotes("£14.1 he", ["test"])).toMatchInlineSnapshot(
      `"£14.1 he"`
    );
  });
  test("fails at parsing escaped euros (expected behavior)", () => {
    expect(parseFootnotes("&#39;14.1 he", ["test"])).toMatchInlineSnapshot(`
"'14.<sup class=\\"text-primary gte-popover\\" data-footnote=\\"gte-footnote-1\\">[1]</sup> he
            <div style='display: none' id=\\"gte-footnote-1\\">test</div>
        "
`);
  });
  test("don't parse numbers", () => {
    expect(parseFootnotes("1753 he", ["test"])).toMatchInlineSnapshot(
      `"1753 he"`
    );
  });
});
