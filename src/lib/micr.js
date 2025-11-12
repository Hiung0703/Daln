// ABA routing checksum: [3*(d1+d4+d7) + 7*(d2+d5+d8) + (d3+d6+d9)] % 10 === 0
export function abaChecksumOk(routing) {
    if (!/^\d{9}$/.test(routing)) return false;
    const d = routing.split("").map((n) => parseInt(n, 10));
    const v = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8]);
    return v % 10 === 0;
  }
  
  // Rất đơn giản cho demo; thực tế nên dùng parser “number words”
  export function wordsToNumberDemo(words) {
    if (!words) return "";
    const frac = /([0-9]{1,2})\s*\/\s*100/.exec(words);
    const hundred = frac ? parseInt(frac[1], 10) / 100 : 0;
    const th = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/.exec(words);
    if (th) return parseFloat(th[1].replaceAll(",", "")) + hundred;
    return "";
  }
  