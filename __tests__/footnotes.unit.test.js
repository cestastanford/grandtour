import { parseFootnotes } from "../public/entry/entry-transformation";

describe("test footnotes", () => {
  test("after semicolon", () => {
    expect(
      parseFootnotes("Fact 1;1 he was good.", ["test"])
    ).toMatchInlineSnapshot(
      `"Fact 1;<sup class=\\"text-primary\\" data-toggle=\\"popover\\" data-content=\\"test\\">[1]</sup> he was good."`
    );
  });
  test("after letter and semicolon", () => {
    expect(
      parseFootnotes("Fact true;1 he was good.", ["test"])
    ).toMatchInlineSnapshot(
      `"Fact true;<sup class=\\"text-primary\\" data-toggle=\\"popover\\" data-content=\\"test\\">[1]</sup> he was good."`
    );
  });
  test("after parenthesis and semicolon", () => {
    expect(
      parseFootnotes("Fact true);1 he was good.", ["test"])
    ).toMatchInlineSnapshot(
      `"Fact true);<sup class=\\"text-primary\\" data-toggle=\\"popover\\" data-content=\\"test\\">[1]</sup> he was good."`
    );
  });
  test("after period", () => {
    expect(
      parseFootnotes("Fact 1.1 he was good.", ["test"])
    ).toMatchInlineSnapshot(
      `"Fact 1.<sup class=\\"text-primary\\" data-toggle=\\"popover\\" data-content=\\"test\\">[1]</sup> he was good."`
    );
  });
  test("after comma", () => {
    expect(
      parseFootnotes("Fact 1,1 he was good.", ["test"])
    ).toMatchInlineSnapshot(
      `"Fact 1,<sup class=\\"text-primary\\" data-toggle=\\"popover\\" data-content=\\"test\\">[1]</sup> he was good."`
    );
  });
  test("parse manual", () => {
    expect(parseFootnotes("{1}", ["test"])).toMatchInlineSnapshot(
      `"<sup class=\\"text-primary\\" data-toggle=\\"popover\\" data-content=\\"test\\">[1]</sup>"`
    );
  });
  test("parse manual at end of sentence", () => {
    expect(
      parseFootnotes("Fact 1.{1} he was good.", ["test"])
    ).toMatchInlineSnapshot(
      `"Fact 1.<sup class=\\"text-primary\\" data-toggle=\\"popover\\" data-content=\\"test\\">[1]</sup> he was good."`
    );
  });
  test("parse double quotes", () => {
    expect(parseFootnotes('hello."1 w', ["test"])).toMatchInlineSnapshot(
      `"hello.\\"<sup class=\\"text-primary\\" data-toggle=\\"popover\\" data-content=\\"test\\">[1]</sup> w"`
    );
  });
  test("parse single quotes", () => {
    expect(parseFootnotes("hello.'1 w", ["test"])).toMatchInlineSnapshot(
      `"hello.'<sup class=\\"text-primary\\" data-toggle=\\"popover\\" data-content=\\"test\\">[1]</sup> w"`
    );
  });
  test("parse single quotes with period after", () => {
    expect(
      parseFootnotes("than the Algerines'.1 w", ["test"])
    ).toMatchInlineSnapshot(
      `"than the Algerines'.<sup class=\\"text-primary\\" data-toggle=\\"popover\\" data-content=\\"test\\">[1]</sup> w"`
    );
  });
  test("don't parse number following beginning of quote", () => {
    expect(
      parseFootnotes('"1 person did this!"', ["test"])
    ).toMatchInlineSnapshot(`"\\"1 person did this!\\""`);
  });
  test("parse number following end of word", () => {
    expect(
      parseFootnotes("hello1 he was good", ["test"])
    ).toMatchInlineSnapshot(
      `"hello<sup class=\\"text-primary\\" data-toggle=\\"popover\\" data-content=\\"test\\">[1]</sup> he was good"`
    );
  });
  test("don't parse euros", () => {
    expect(parseFootnotes("£14.1 he", ["test"])).toMatchInlineSnapshot(
      `"£14.1 he"`
    );
  });
  test("fails at parsing escaped euros (expected behavior)", () => {
    expect(parseFootnotes("&#39;14.1 he", ["test"])).toMatchInlineSnapshot(
      `"'14.<sup class=\\"text-primary\\" data-toggle=\\"popover\\" data-content=\\"test\\">[1]</sup> he"`
    );
  });
  test("don't parse numbers", () => {
    expect(parseFootnotes("1753 he", ["test"])).toMatchInlineSnapshot(
      `"1753 he"`
    );
  });
});
