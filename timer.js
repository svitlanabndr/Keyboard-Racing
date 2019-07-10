class Timer {
    constructor( 
        onlineUsersProvider,
        endGameProvider,
        gameTime = 50,
        breakTime = 20
    ) {
        this.onlineUsersProvider = onlineUsersProvider;
        this.endGameProvider = endGameProvider;
        this.gameTime = gameTime;
        this.breakTime = breakTime;  
    }
    
    start(callback) {
        const GAME_TIME = this.gameTime;
        const BREAK_TIME = this.breakTime;
        const INTERVAL = 1000;
        const getGameTime = () => this.gameTime;
        const getBreakTime = () => this.breakTime;
        const decrGameTime = () => this.gameTime--;
        const decrBreakTime = () => this.breakTime--;
        const onlineUsersProvider = this.onlineUsersProvider;
        const endGameProvider = this.endGameProvider;

        setTimeout(function timeOut() {
            if(getBreakTime() === 0) {
                if(onlineUsersProvider().length >= 1) {     
                    callback('startGame');
                    setTimeout(function gameTimer() {
                        if(getGameTime() === 0 || endGameProvider()) {
                            callback('clearTrace');
                            setTimeout(() => {
                                callback('clearGame');
                                resetTimers();
                                setTimeout(timeOut, INTERVAL);
                            }, 5000);
                        } else {
                            callback('gameTimer', getGameTime());
                            setTimeout(gameTimer, INTERVAL);
                        }
                        decrGameTime();
                    }, INTERVAL);
                } else {
                    resetTimers();
                    setTimeout(timeOut, INTERVAL);
                }
            } else {
                if(getBreakTime() === 5) 
                    callback('preGame');       
                callback('breakTimer', getBreakTime());
                setTimeout(timeOut, INTERVAL);
            }
            decrBreakTime();
        }, INTERVAL);


        const resetTimers = () => {
            this.breakTime = BREAK_TIME;
            this.gameTime = GAME_TIME;
        }
    }
}

module.exports = Timer;