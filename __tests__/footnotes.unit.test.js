import { parseFootnotes } from "../public/entry/entry-transformation";

describe("test footnotes", () => {
  test("after semicolon", () => {
    expect(
      parseFootnotes("Fact 1;1 he was good.", ["test"])
    ).toMatchInlineSnapshot(
      `"Fact 1;<sup class=\\"text-primary\\" data-toggle=\\"popover\\" data-content=\\"test\\">[1]</sup> he was good."`
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
  test("don't parse number following beginning of quote", () => {
    expect(
      parseFootnotes('"1 person did this!"', ["test"])
    ).toMatchInlineSnapshot(`"\\"1 person did this!\\""`);
  });
  test("parse number following end of word", () => {
    expect(parseFootnotes("hello1", ["test"])).toMatchInlineSnapshot(
      `"hello1"`
    );
  });
  test("don't parse euros", () => {
    expect(parseFootnotes("£14.1", ["test"])).toMatchInlineSnapshot(`"£14.1"`);
  });
});
