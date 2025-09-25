// Mock for @faker-js/faker to avoid ESM import issues in Jest
module.exports = {
  faker: {
    string: {
      alphanumeric: () => 'mockedString123',
      sample: () => 'mockedSample',
      uuid: () => '123e4567-e89b-12d3-a456-426614174000'
    },
    number: {
      int: () => 123,
      float: () => 123.45
    },
    datatype: {
      boolean: () => true
    },
    date: {
      recent: () => new Date('2023-01-01T00:00:00.000Z')
    },
    lorem: {
      word: () => 'word',
      words: () => 'lorem ipsum dolor',
      sentence: () => 'Lorem ipsum dolor sit amet.'
    },
    person: {
      firstName: () => 'John',
      lastName: () => 'Doe',
      fullName: () => 'John Doe'
    },
    internet: {
      email: () => 'john.doe@example.com',
      url: () => 'https://example.com'
    },
    helpers: {
      arrayElement: (arr) => arr[0] || null,
      arrayElements: (arr) => arr || []
    }
  }
};