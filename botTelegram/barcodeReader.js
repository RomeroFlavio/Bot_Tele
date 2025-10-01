import sharp from 'sharp';
import { MultiFormatReader, BarcodeFormat, DecodeHintType, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } from '@zxing/library';

// Función para procesar código de barras desde buffer
export async function procesarCodigoBarra(bufferImagen, ctx, chatId) {
  try {
    const { data, info } = await sharp(bufferImagen)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const luminanceSource = new RGBLuminanceSource(data, info.width, info.height);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

    const reader = new MultiFormatReader();
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.EAN_13,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.EAN_8,
      BarcodeFormat.ITF
    ]);
    reader.setHints(hints);

    const result = reader.decode(binaryBitmap);
    const codigo = result.getText();

    console.log('Código de barras leído:', codigo);

    if (ctx) {
      await ctx.reply(`Código de barras leído: ${codigo}`);
    }

    /*if (chatId && store.chats[chatId]) {
      store.actualizarChat(chatId, 'datoAdicional', codigo); // o el campo que quieras
    }*/

    return codigo;
  } catch (err) {
    console.error('Error al procesar el código de barras:', err.message);
    if (ctx) await ctx.reply('Error al procesar el código de barras: ' + err.message);
    return null;
  }
}