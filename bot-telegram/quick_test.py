import asyncio
import telegram
import sys
import io

# Fix Windows encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def main():
    bot = telegram.Bot('8172610054:AAH4RDMjU3GkKvYil27hBKSiUJMi7SmMa8U')
    me = await bot.get_me()
    print('Bot OK:', me.first_name, '@'+me.username)
    print('Token valido, bot pronto!')

asyncio.run(main())
