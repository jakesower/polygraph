declare const _default: {
    objects: {
        bears: {
            1: {
                name: string;
                gender: string;
                belly_badge: string;
                fur_color: string;
            };
            2: {
                name: string;
                gender: string;
                belly_badge: string;
                fur_color: string;
            };
            3: {
                name: string;
                gender: string;
                belly_badge: string;
                fur_color: string;
            };
            5: {
                name: string;
                gender: string;
                belly_badge: string;
                fur_color: string;
            };
        };
        homes: {
            1: {
                name: string;
                location: string;
            };
            2: {
                name: string;
                location: string;
            };
        };
        powers: {
            careBearStare: {
                name: string;
                description: string;
            };
            makeWish: {
                name: string;
                description: string;
            };
        };
    };
    relationships: {
        'bears/home': {
            local: string;
            foreign: string;
        }[];
        'bears/best_friend': {
            local: string;
            foreign: string;
        }[];
        'bears/powers': {
            local: string;
            foreign: string;
        }[];
    };
};
export default _default;
