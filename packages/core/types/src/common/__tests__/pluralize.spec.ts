import { expectTypeOf } from "expect-type"
import { Pluralize } from "../common"

describe("Pluralize", () => {
  test("pluralize uncountable nouns", () => {
    expectTypeOf<Pluralize<"media">>().toEqualTypeOf<"media">()
    expectTypeOf<Pluralize<"Media">>().toEqualTypeOf<"Media">()
    expectTypeOf<Pluralize<"you">>().toEqualTypeOf<"you">()
    expectTypeOf<Pluralize<"sheep">>().toEqualTypeOf<"sheep">()
    expectTypeOf<Pluralize<"series">>().toEqualTypeOf<"series">()
    expectTypeOf<Pluralize<"species">>().toEqualTypeOf<"species">()
    expectTypeOf<Pluralize<"deer">>().toEqualTypeOf<"deer">()
    expectTypeOf<Pluralize<"info">>().toEqualTypeOf<"info">()
  })

  test("pluralize words ending with fe", () => {
    expectTypeOf<Pluralize<"wife">>().toEqualTypeOf<"wives">()
    expectTypeOf<Pluralize<"knife">>().toEqualTypeOf<"knives">()
  })

  test("pluralize words ending with o", () => {
    expectTypeOf<Pluralize<"hero">>().toEqualTypeOf<"heroes">()
  })

  test("pluralize words ending with ch", () => {
    expectTypeOf<Pluralize<"watch">>().toEqualTypeOf<"watches">()
  })

  test("pluralize words ending with z", () => {
    expectTypeOf<Pluralize<"fiz">>().toEqualTypeOf<"fizes">()
  })

  test("pluralize words ending with y", () => {
    expectTypeOf<Pluralize<"puppy">>().toEqualTypeOf<"puppies">()
  })

  test("pluralize words with special rules", () => {
    expectTypeOf<Pluralize<"person">>().toEqualTypeOf<"people">()
    expectTypeOf<Pluralize<"child">>().toEqualTypeOf<"children">()
    expectTypeOf<Pluralize<"man">>().toEqualTypeOf<"men">()
    expectTypeOf<Pluralize<"criterion">>().toEqualTypeOf<"criteria">()
    expectTypeOf<Pluralize<"tooth">>().toEqualTypeOf<"teeth">()
    expectTypeOf<Pluralize<"foot">>().toEqualTypeOf<"feet">()
  })
})
