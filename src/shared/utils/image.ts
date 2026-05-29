/**
 * Redimensiona um File de imagem para no máximo `maxSize` px no lado maior
 * e retorna base64 (webp com qualidade 0.85).
 * Fallback para FileReader se o canvas não estiver disponível.
 */
export function resizeImageToBase64(file: File, maxSize = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const ratio = Math.min(1, maxSize / Math.max(img.width, img.height))
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        // Fallback: retorna base64 sem redimensionar
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
        return
      }

      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/webp', 0.85))
    }

    img.onerror = reject
    img.src = objectUrl
  })
}
