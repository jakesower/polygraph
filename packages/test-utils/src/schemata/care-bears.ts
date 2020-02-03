export default {
  title: 'Care Bear Schema',
  resources: {
    bears: {
      singular: 'bear',
      attributes: {
        name: {
          type: 'string',
          key: 'name',
        },
        gender: {
          type: 'string',
          key: 'gender',
        },
        belly_badge: {
          type: 'string',
          key: 'belly_badge',
        },
        fur_color: {
          type: 'string',
          key: 'fur_color',
        },
      },
      relationships: {
        home: {
          type: 'homes',
          cardinality: 'one',
          inverse: 'bears',
          key: 'home',
        },
        powers: {
          type: 'powers',
          cardinality: 'many',
          inverse: 'bears',
          key: 'powers',
        },
        best_friend: {
          type: 'bears',
          cardinality: 'one',
          inverse: 'best_friend',
          key: 'best_friend',
        },
      },
      key: 'bears',
    },
    homes: {
      singular: 'home',
      attributes: {
        name: {
          type: 'string',
          key: 'name',
        },
        location: {
          type: 'string',
          key: 'location',
        },
        caring_meter: {
          type: 'number',
          key: 'caring_meter',
        },
      },
      relationships: {
        bears: {
          type: 'bears',
          cardinality: 'many',
          inverse: 'home',
          key: 'bears',
        },
      },
      key: 'homes',
    },
    powers: {
      singular: 'power',
      attributes: {
        name: {
          type: 'string',
          key: 'name',
        },
        description: {
          type: 'text',
          key: 'description',
        },
      },
      relationships: {
        bears: {
          type: 'bears',
          cardinality: 'many',
          inverse: 'powers',
          key: 'bears',
        },
      },
      key: 'powers',
    },
  },
};
