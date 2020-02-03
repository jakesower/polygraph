"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    objects: {
        bears: {
            1: {
                name: 'Tenderheart Bear',
                gender: 'male',
                belly_badge: 'heart',
                fur_color: 'tan',
            },
            2: {
                name: 'Cheer Bear',
                gender: 'female',
                belly_badge: 'rainbow',
                fur_color: 'pink',
            },
            3: {
                name: 'Wish Bear',
                gender: 'female',
                belly_badge: 'shooting star',
                fur_color: 'turquoise',
            },
            5: {
                name: 'Wonderheart Bear',
                gender: 'female',
                belly_badge: 'three hearts',
                fur_color: 'pink',
            },
        },
        homes: {
            1: { name: 'Care-a-Lot', location: 'Kingdom of Caring' },
            2: { name: 'Forest of Feelings', location: 'Kingdom of Caring' },
        },
        powers: {
            careBearStare: { name: 'Care Bear Stare', description: 'Defeats enemies and heals friends' },
            makeWish: { name: 'Make a Wish', description: 'Makes a wish on Twinkers' },
        },
    },
    relationships: {
        'bears/home': [
            { local: '1', foreign: '1' },
            { local: '2', foreign: '1' },
            { local: '3', foreign: '1' },
        ],
        'bears/best_friend': [{ local: '2', foreign: '3' }],
        'bears/powers': [
            { local: '1', foreign: 'careBearStare' },
            { local: '2', foreign: 'careBearStare' },
            { local: '3', foreign: 'careBearStare' },
        ],
    },
};
