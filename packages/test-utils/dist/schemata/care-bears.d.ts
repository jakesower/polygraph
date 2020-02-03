declare const _default: {
    title: string;
    resources: {
        bears: {
            singular: string;
            attributes: {
                name: {
                    type: string;
                    key: string;
                };
                gender: {
                    type: string;
                    key: string;
                };
                belly_badge: {
                    type: string;
                    key: string;
                };
                fur_color: {
                    type: string;
                    key: string;
                };
            };
            relationships: {
                home: {
                    type: string;
                    cardinality: string;
                    inverse: string;
                    key: string;
                };
                powers: {
                    type: string;
                    cardinality: string;
                    inverse: string;
                    key: string;
                };
                best_friend: {
                    type: string;
                    cardinality: string;
                    inverse: string;
                    key: string;
                };
            };
            key: string;
        };
        homes: {
            singular: string;
            attributes: {
                name: {
                    type: string;
                    key: string;
                };
                location: {
                    type: string;
                    key: string;
                };
                caring_meter: {
                    type: string;
                    key: string;
                };
            };
            relationships: {
                bears: {
                    type: string;
                    cardinality: string;
                    inverse: string;
                    key: string;
                };
            };
            key: string;
        };
        powers: {
            singular: string;
            attributes: {
                name: {
                    type: string;
                    key: string;
                };
                description: {
                    type: string;
                    key: string;
                };
            };
            relationships: {
                bears: {
                    type: string;
                    cardinality: string;
                    inverse: string;
                    key: string;
                };
            };
            key: string;
        };
    };
};
export default _default;
