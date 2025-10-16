import fs from 'fs';
import path from 'path';

export async function handleAudioDownload(ctx, bot) {
    try {
      const chatId = ctx.chat.id;
      const message = ctx.message;
  
      const audio = message.voice || message.audio;
  
      if (!audio) {
        await ctx.reply('⚠️ No se detectó ningún audio.');
        return;
      }
  
      const fileId = audio.file_id;
      const fileLink = await bot.telegram.getFileLink(fileId);
      const dir = './audios';

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
  
      const filename = path.join(dir, `${chatId}_${Date.now()}.ogg`);
      const response = await fetch(fileLink.href);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(filename, Buffer.from(buffer));
  
      await ctx.reply('🎧 Audio recibido correctamente.');
  
    } catch (err) {
      console.error('❌ Error al descargar el audio:', err);
      await ctx.reply('⚠️ Hubo un problema al procesar el audio.');
    }
}  