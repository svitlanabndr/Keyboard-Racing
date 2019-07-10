// Facade
class RatingFacade {
    static createRating(gamers) {
    
        let startRating = [];

        gamers.forEach((gamer, i) => {
            startRating.push(new Gamer(i, gamer));
        });

        return startRating;
    }
}
class Gamer {
    constructor(id, user) {
        this.id = id + 1;
        this.user = user;
        this.score = 0;
        this.car = new Car(this.id - 1).car;
    }
}

class Car {
    constructor(id) {
        this.car = this.createCar(id);
    }

    createCar(id) {
        const BRANDS = require('./brands.json');

        if (BRANDS[id]) {
            return this.getUniqueCar(BRANDS, id);
        }
        else {
            return this.getRandomCar(BRANDS);
        }
    }

    getUniqueCar(list, id) {
        const brand = list[id].brand;
        return this.getRandomColor() + ' ' + brand;
    }

    getRandomCar(list) {
        const brand = list[Math.floor(Math.random() * list.length)].brand;
        return this.getRandomColor() + ' ' + brand;
    }

    getRandomColor() {
        const COLORS = require('./colors.json');
        return COLORS[Math.floor(Math.random() * COLORS.length)].color;
    }
}

module.exports = RatingFacade;