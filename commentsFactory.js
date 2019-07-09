// Factory
class CommentsFactory { 
    static createComment(type, context) {
        switch (type) {
            case 'hello':
                return 'Комментировать это все действо Вам буду я, Эскейп Ентерович и я рад вас приветствовать со словами Доброго Вам дня господа! ';
            case 'start':
                return this.createStartMessage(context);
            case 'disconnect':
                return this.createDisconnectMessage(context);
            case 'winner':
                return this.createWinnerMessage(context);
            case 'current':
                return this.createCurrentMessage(context);
            case 'finish':
                return this.createFinishMessage(context);
            case 'joke':
                return this.createJokeMessage();
            default:
                break;
        }
        return message;
    }

    static createStartMessage(rating) {
        let startMessage = 'А тем временем, список гонщиков: ';
        rating.forEach((ratingItem) => {
            startMessage += `${ratingItem.user} на ${ratingItem.car} под номером ${ratingItem.id}, `;
        });
        return startMessage += 'всем удачи!';
    }

    static createDisconnectMessage(user) {
        return `К сожалению, ${user} попал в аварию и выбывает из гонки.`;
    }

    static createWinnerMessage(ratingItem) {
        return `Финишную прямую пересекает ${ratingItem.user}. Его результат составляет ${ratingItem.score} секунд`;
    }

    static createCurrentMessage(rating) {
        let currentMessage = 'На данный момент ситуация следующая: ';
        rating.forEach((ratingItem, i) => {
            if(i === 0) currentMessage += `${ratingItem.user} на ${ratingItem.car} сейчас впереди всех, `;
            else if(i === 1) currentMessage += `за ним идет ${ratingItem.user} на ${ratingItem.car}, `;
            else if(i === 2) currentMessage += `третьим едет ${ratingItem.user} на ${ratingItem.car}. Остальные немного отстают от них: `;
            else if (i > 2) currentMessage += `${ratingItem.user} едет ${i+1}-ым, `;
        });
        return currentMessage += `посмотрим, что будет дальше!`;
    }

    static createFinishMessage(winRating) {
        let finishMessage = 'Гонка подошла к концу и финальный результат: ';
        winRating.forEach((ratingItem, i) => {
            finishMessage += `${i+1}-ое место занимает ${ratingItem.user}. `;
        });
        return finishMessage += 'Остальные не успели дойти до финиша.';
    }

    static createJokeMessage() {
        const JOKES = [
            'Ходят легенды, что если 5—6 водителей Жигулей соберутся вместе и опустошат свои багажники, то запросто соберут ещё одну машину.',
            'Ты не можешь ни выиграть, ни проиграть, до тех пор, пока ты не участвуешь в гонках.',
            'Главное — не то, что ты падал во время гонки, а то, что ты всякий раз поднимался. Продолжай бороться, ведь это твоя мечта.',
            'Даже когда у вас не лучшая машина, всегда надо верить, что именно эта гонка станет вашей лучшей. Это – часть мотивации',
            'Гонки это жизнь. Все, что происходит до или после них – всего лишь ожидание',
            'Победитель – не тот, кто в самой быстрой машине, а тот, кто отказывается проигрывать',
            '— Почему блондинкам нравятся машины с люком в крыше? — Больше места для ног.'
        ]
        return JOKES[Math.floor(Math.random() * JOKES.length)];
    }
}

module.exports = CommentsFactory;