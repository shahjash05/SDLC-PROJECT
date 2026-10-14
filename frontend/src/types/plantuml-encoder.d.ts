declare module 'plantuml-encoder' {
  export function encode(val: string): string;
  export function decode(val: string): string;
  const plantumlEncoder: {
    encode: (val: string) => string;
    decode: (val: string) => string;
  };
  export default plantumlEncoder;
}
