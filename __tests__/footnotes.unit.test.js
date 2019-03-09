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
  test("don't parse euros", () => {
    expect(parseFootnotes("£14.1", ["test"])).toMatchInlineSnapshot(`"£14.1"`);
  });
});
