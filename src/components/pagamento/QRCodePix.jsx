/**
 * Gera um QR Code via API pública (sem biblioteca).
 * Quando vier o BR Code (PIX EMV) verdadeiro, trocar por uma lib client-side.
 */
export default function QRCodePix({ chave, size = 150 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    chave
  )}&bgcolor=ffffff&color=000000&margin=10`;
  return (
    <img
      src={url}
      alt="QR Code PIX"
      width={size}
      height={size}
      style={{ borderRadius: 8, display: "block" }}
    />
  );
}
