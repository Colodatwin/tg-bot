require('dotenv').config();
const { Bot, Keyboard, InlineKeyboard, GrammyError, HttpError } = require('grammy');
// import {bot} from 'grammy'
const { getRandomQuestion, getCorrectAnswer } = require('./utils')
const bot = new Bot(process.env.BOT_API_KEY);

bot.command('start', async (ctx) => {
  const startKeyboard = new Keyboard()
    .text('HTML')
    .text('CSS')
    .row()
    .text('JavaScript')
    .text('React')
    .row()
    .text('Случайный вопрос')
    .resized();
  await ctx.reply(`Добро пожаловать в бота для фронтенд веб-разработчиков! 🌐
  \nМеня зовут Frontend Developer, и я здесь, чтобы помочь вам в усвоении и закреплении важных знаний о фронтенд разработке, а также подготовке к собеседованиям.
  \n📚 С моей помощью, вы сможете изучать новые темы, решать задачи и получать обратную связь.
  \n🛠 Если у вас есть вопросы или нужна помощь, не стесняйтесь обращаться.
  \nНачнем учиться и развиваться вместе! 💡`);
  await ctx.reply('Наш бот предлагает тесты по разным темам веб-разработки. \nДля начала выберите интересующую вас тему 👇', {
    reply_markup: startKeyboard,
  })
});

bot.hears(['HTML', 'CSS', 'JavaScript', 'React', 'Случайный вопрос'], async (ctx) => {
  const topic = ctx.message.text.toLowerCase();
  const {question, questionTopic} = getRandomQuestion(topic);
  let keyboard;

  if (question.hasOptions) {
    const buttonRows = question.options.map((option) => [
      InlineKeyboard.text(
        option.text,
        JSON.stringify({
          type: `${questionTopic}-option`,
          isCorrect: option.isCorrect,
          questionId: question.id,
        }),
      ),
    ]);
    keyboard = InlineKeyboard.from(buttonRows);
  } else {
    keyboard = new InlineKeyboard().text(
      'Узнать ответ',
      JSON.stringify({
        type: questionTopic,
        questionId: question.id,
      }),
    );
  }

  await ctx.reply(question.text, {
    reply_markup: keyboard,
  });
});



bot.on('callback_query:data', async (ctx) => {
  const callbackData = JSON.parse(ctx.callbackQuery.data);

  if (!callbackData.type.includes('option')) {
    const answer = getCorrectAnswer(callbackData.type, callbackData.questionId);
    await ctx.reply(answer, {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
    await ctx.answerCallbackQuery();
    return;
  }

  if(callbackData.isCorrect){
    await ctx.reply('Верно ✅');
    await ctx.answerCallbackQuery();
    return;
  }

  const answer = getCorrectAnswer(callbackData.type.split('-')[0], callbackData.questionId);
  await ctx.reply(`Неверно ❌ \nПравильный ответ: ${answer}`);
  await ctx.answerCallbackQuery();
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

bot.start();