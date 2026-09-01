import QRCode from "qrcode";

export async function qrSvg(text: string, size = 96) {
  return QRCode.toString(text, {
    type: "svg",
    margin: 1,
    width: size,
    errorCorrectionLevel: "M",
    color: { dark: "#13294b", light: "#ffffff" },
  });
}
