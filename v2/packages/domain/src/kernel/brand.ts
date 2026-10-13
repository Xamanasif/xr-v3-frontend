/**
 * Nominal ("branded") types: a string or number that the type system keeps apart from every
 * other string or number (Appendix C §1.1). Brands carry no runtime cost.
 */
declare const brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [brand]: B };

/**
 * Brands a value without checking it. For adapters, seeds and tests that already hold a value
 * in the drawn format; rules never call it on user input.
 */
export function unsafeBrand<B extends Brand<string, string>>(value: string): B {
  return value as B;
}
