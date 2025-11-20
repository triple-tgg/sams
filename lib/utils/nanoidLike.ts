// const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-";
// export function nanoid(size = 21): string {
//   const bytes = (typeof crypto !== "undefined" && (crypto as any).getRandomValues)
//     ? (crypto as any).getRandomValues(new Uint8Array(size))
//     : (() => { const arr = new Uint8Array(size); for (let i = 0; i < size; i++) arr[i] = Math.floor(Math.random() * 256); return arr; })();

//   return Array.from(bytes as Uint8Array).map((b: number) => alphabet[b % alphabet.length]).join('').slice(0, size);
// }

// ตัวอย่าง
// console.log(nanoid(10)); // ex: "B3k_g7Yf-2"
// const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const alphabet = "0123456789";

export function nanoid(size = 21): string {
  const bytes =
    typeof crypto !== "undefined" && (crypto as any).getRandomValues
      ? (crypto as any).getRandomValues(new Uint8Array(size))
      : (() => {
        const arr = new Uint8Array(size);
        for (let i = 0; i < size; i++) arr[i] = Math.floor(Math.random() * 256);
        return arr;
      })();

  // return Array.from(bytes)
  //   .map((b) => alphabet[b % alphabet.length])
  //   .join("")
  //   .slice(0, size);
  return Array.from(bytes as Uint8Array).map((b: number) => alphabet[b % alphabet.length]).join('').slice(0, size);

}

// ตัวอย่างใช้งาน
// console.log(nanoid(10));