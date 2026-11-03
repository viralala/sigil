import sharp from "sharp";
for (const [src, out, size] of [["public/icon.svg","public/icon-192.png",192],["public/icon.svg","public/icon-512.png",512],["public/icon-maskable.svg","public/icon-maskable-512.png",512]]) {
  await sharp(src, { density: 600 }).resize(size, size).png().toFile(out);
}
console.log("icons ok");
