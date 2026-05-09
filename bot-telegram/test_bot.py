import asyncio
import telegram

async def test():
    bot = telegram.Bot('8172610054:AAH4RDMjU3GkKvYil27hBKSiUJMi7SmMa8U')
    me = await bot.get_me()
    print('OK:', me.first_name, '@'+me.username)

asyncio.run(test())
