/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * ModusBox
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com>
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/

'use strict'

const OpenApiMockGenerator = require('../../../src/lib/openApiMockGenerator')
// const mockGenerator = new OpenApiMockGenerator()
const specFilePrefix = 'test/samples/'

const jsfRef = [
  {
    id: 'quoteId'
  },
  {
    id: 'id'
  },
  {
    id: 'state',
    pattern: 'Created|Closed'
  },
  {
    id: 'reason',
    pattern: 'Created|Closed'
  },

  {
    id: 'Content-Length',
    pattern: '123'
  }
]

describe('OpenApiMockGenerator', () => {
  describe('load a async api file', () => {
    const mockGenerator = new OpenApiMockGenerator()
    it('Load method should not throw error', async () => {
      await expect(mockGenerator.load(specFilePrefix + 'api_spec_async.yaml')).resolves.toBeUndefined()
    })
    it('generateRequestBody should generate a request body', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', jsfRef)
      expect(result).toHaveProperty('quoteId')
    })
    it('generateRequestHeaders should generate a request headers', async () => {
      const result = await mockGenerator.generateRequestHeaders('/quotes', 'post', jsfRef)
      expect(result).toHaveProperty('Accept')
      expect(result).toHaveProperty('Content-Type')
      expect(result).toHaveProperty('Date')
    })
    it('generateRequestHeaders should generate a request headers', async () => {
      const result = await mockGenerator.generateRequestHeaders('/transfers', 'post')
      expect(result).toEqual(expect.anything())
    })
    it('generateRequestPathParams should generate empty object for path params', async () => {
      const result = await mockGenerator.generateRequestPathParams('/transfers', 'post', jsfRef)
      expect(result).toEqual({})
    })
  })
  describe('load a sync api file', () => {
    const mockGenerator = new OpenApiMockGenerator()
    it('Load method should not throw error', async () => {
      await expect(mockGenerator.load(specFilePrefix + 'api_spec_sync_empty.yaml')).resolves.toBeUndefined()
    })
    it('Load method should not throw error', async () => {
      await expect(mockGenerator.load(specFilePrefix + 'api_spec_sync.yaml')).resolves.toBeUndefined()
    })
    it('generateRequestBody should generate a request body', async () => {
      const result = await mockGenerator.generateRequestBody('/settlements', 'post', jsfRef)
      expect(result).toHaveProperty('reason')
      expect(result).toHaveProperty('settlementWindows')
    })
    it('generateRequestBody should generate a request body', async () => {
      const result = await mockGenerator.generateRequestBody('/settlements', 'post')
      expect(result).toHaveProperty('reason')
      expect(result).toHaveProperty('settlementWindows')
    })
    it('generateResponseBody should generate a request body', async () => {
      const result = await mockGenerator.generateResponseBody('/settlements', 'get', jsfRef)
      expect(result).toHaveProperty('body')
      expect(result).toHaveProperty('status')
    })
    it('generateResponseBody should generate a request body', async () => {
      const result = await mockGenerator.generateResponseBody('/settlements', 'get')
      expect(result).toHaveProperty('body')
      expect(result).toHaveProperty('status')
    })

    it('generateResponseBody should generate a request body if response type is array', async () => {
      const result = await mockGenerator.generateResponseBody('/settlementWindows', 'get', jsfRef)
      expect(result).toStrictEqual({})
    })
    it('generateResponseBody should generate a request body if response type is object', async () => {
      const result = await mockGenerator.generateResponseBody('/settlementWindows/{id}', 'get', jsfRef)
      expect(result.status).toBe('200')
    })
    it('generateRequestQueryParams should generate query params', async () => {
      const result = await mockGenerator.generateRequestQueryParams('/settlementWindows', 'get')
      expect(result).toHaveProperty('fromDateTime')
      expect(result).toHaveProperty('participantId')
      expect(result).toHaveProperty('state')
    })
    it('generateRequestQueryParams should generate query params', async () => {
      const result = await mockGenerator.generateRequestQueryParams('/settlementWindows', 'get', jsfRef)
      console.log(result)
      expect(result).toHaveProperty('fromDateTime')
      expect(result).toHaveProperty('participantId')
      expect(result).toHaveProperty('state')
    })
    it('generateRequestQueryParams should generate query params', async () => {
      const result = await mockGenerator.generateRequestQueryParams('/settlementWindows/{id}', 'get', jsfRef)
      expect(result).toEqual({})
    })
    it('generateRequestPathParams should generate path params', async () => {
      const result = await mockGenerator.generateRequestPathParams('/settlementWindows/{id}', 'get', jsfRef)
      expect(result).toHaveProperty('id')
    })
  })
})

describe('Additional Coverage Tests', () => {
  let mockGenerator

  beforeEach(async () => {
    mockGenerator = new OpenApiMockGenerator()
    await mockGenerator.load('test/samples/api_spec_async.yaml')
  })

  it('should handle schema with oneOf in properties', async () => {
    mockGenerator.schema = {
      paths: {
        '/test': {
          post: {
            operationId: 'testOperation',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      test: {
                        oneOf: [
                          { type: 'string', pattern: '^test$' },
                          { type: 'number', minimum: 1, maximum: 10 }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    const result = await mockGenerator.generateRequestBody('/test', 'post')
    expect(typeof result).toBe('object')
  })

  it('should handle schema with anyOf in properties', async () => {
    mockGenerator.schema = {
      paths: {
        '/test': {
          post: {
            operationId: 'testOperation',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      test: {
                        anyOf: [
                          { type: 'string', pattern: '^test$' },
                          { type: 'number', minimum: 1, maximum: 10 }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    const result = await mockGenerator.generateRequestBody('/test', 'post')
    expect(typeof result).toBe('object')
  })

  it('should handle schema with if/then/else in properties', async () => {
    mockGenerator.schema = {
      paths: {
        '/test': {
          post: {
            operationId: 'testOperation',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['A', 'B'] },
                      value: { type: 'string' }
                    },
                    if: {
                      properties: { type: { const: 'A' } }
                    },
                    then: {
                      properties: { value: { const: 'A-value' } }
                    },
                    else: {
                      properties: { value: { const: 'B-value' } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    const result = await mockGenerator.generateRequestBody('/test', 'post')
    expect(typeof result).toBe('object')
  })

  it('should handle schema with dependencies in properties', async () => {
    mockGenerator.schema = {
      paths: {
        '/test': {
          post: {
            operationId: 'testOperation',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['A', 'B'] },
                      value: { type: 'string' }
                    },
                    dependencies: {
                      type: {
                        properties: {
                          value: { type: 'string', const: 'dependent-value' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    const result = await mockGenerator.generateRequestBody('/test', 'post')
    expect(typeof result).toBe('object')
  })

  it('should handle schema with patternProperties in properties', async () => {
    mockGenerator.schema = {
      paths: {
        '/test': {
          post: {
            operationId: 'testOperation',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    patternProperties: {
                      '^[a-z]+$': { type: 'string', const: 'test-value' }
                    },
                    additionalProperties: false,
                    minProperties: 1
                  }
                }
              }
            }
          }
        }
      }
    }
    const result = await mockGenerator.generateRequestBody('/test', 'post')
    expect(typeof result).toBe('object')
  })

  it('should handle schema with error in processRefs', async () => {
    mockGenerator.schema = {
      paths: {
        '/test': {
          post: {
            operationId: 'testOperation',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      test: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    mockGenerator.processRefs = jest.fn().mockImplementation(() => {
      throw new Error('Test error')
    })
    const result = await mockGenerator.generateRequestBody('/test', 'post', [{ id: 'invalid' }])
    expect(typeof result).toBe('object')
  })

  it('should handle schema with error in postProcessMock', async () => {
    mockGenerator.schema = {
      paths: {
        '/test': {
          post: {
            operationId: 'testOperation',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      test: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    mockGenerator.postProcessMock = jest.fn().mockImplementation(() => {
      throw new Error('Test error')
    })
    const result = await mockGenerator.generateRequestBody('/test', 'post')
    expect(typeof result).toBe('object')
  })

  it('should handle schema with error in deepSchemaWalk', async () => {
    mockGenerator.schema = {
      paths: {
        '/test': {
          post: {
            operationId: 'testOperation',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      test: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    mockGenerator.deepSchemaWalk = jest.fn().mockImplementation(() => {
      throw new Error('Test error')
    })
    const result = await mockGenerator.generateRequestBody('/test', 'post')
    expect(typeof result).toBe('object')
  })

  it('should handle schema with error in generateMockResponseBody', async () => {
    mockGenerator.schema = {
      paths: {
        '/test': {
          post: {
            operationId: 'testOperation',
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        test: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    mockGenerator.generateMockResponseBody = jest.fn().mockImplementation(() => {
      throw new Error('Test error')
    })
    const result = await mockGenerator.generateResponseBody('/test', 'post')
    expect(typeof result).toBe('object')
  })

  it('should handle schema with error in generateMockHeaders', async () => {
    mockGenerator.schema = {
      paths: {
        '/test': {
          post: {
            operationId: 'testOperation',
            parameters: [
              {
                in: 'header',
                name: 'X-Test',
                schema: { type: 'string' }
              }
            ]
          }
        }
      }
    }
    mockGenerator.generateMockHeaders = jest.fn().mockImplementation(() => {
      throw new Error('Test error')
    })
    const result = await mockGenerator.generateRequestHeaders('/test', 'post')
    expect(typeof result).toBe('object')
  })

  it('should handle schema with error in generateMockQueryParams', async () => {
    mockGenerator.schema = {
      paths: {
        '/test': {
          post: {
            operationId: 'testOperation',
            parameters: [
              {
                in: 'query',
                name: 'test',
                schema: { type: 'string' }
              }
            ]
          }
        }
      }
    }
    mockGenerator.generateMockQueryParams = jest.fn().mockImplementation(() => {
      throw new Error('Test error')
    })
    const result = await mockGenerator.generateRequestQueryParams('/test', 'post')
    expect(typeof result).toBe('object')
  })

  it('should handle schema with error in generateMockPathParams', async () => {
    mockGenerator.schema = {
      paths: {
        '/test/{id}': {
          post: {
            operationId: 'testOperation',
            parameters: [
              {
                in: 'path',
                name: 'id',
                schema: { type: 'string' }
              }
            ]
          }
        }
      }
    }
    mockGenerator.generateMockPathParams = jest.fn().mockImplementation(() => {
      throw new Error('Test error')
    })
    const result = await mockGenerator.generateRequestPathParams('/test/{id}', 'post')
    expect(typeof result).toBe('object')
  })
})

describe('postProcessMock and FSP ID Generation Tests', () => {
  let mockGenerator

  beforeEach(async () => {
    mockGenerator = new OpenApiMockGenerator()
    // Set up a base schema for testing
    mockGenerator.schema = {
      paths: {
        '/test': {
          post: {
            operationId: 'testOperation',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {}
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  describe('FSP ID Generation', () => {
    it('should generate valid FSP IDs in request body', async () => {
      mockGenerator.schema.paths['/test'].post.requestBody.content['application/json'].schema = {
        type: 'object',
        properties: {
          fspId: { type: 'string', format: 'fsp-id' },
          payerFsp: { type: 'string', format: 'fsp-id' },
          payeeFsp: { type: 'string', format: 'fsp-id' }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post', [])
      expect(result.fspId).toMatch(/^[A-Z0-9]{1,32}$/)
      expect(result.payerFsp).toMatch(/^[A-Z0-9]{1,32}$/)
      expect(result.payeeFsp).toMatch(/^[A-Z0-9]{1,32}$/)
    })

    it('should generate valid FSP IDs in nested objects', async () => {
      mockGenerator.schema.paths['/test'].post.requestBody.content['application/json'].schema = {
        type: 'object',
        properties: {
          party: {
            type: 'object',
            properties: {
              fspId: { type: 'string', format: 'fsp-id' },
              name: { type: 'string' }
            }
          }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post', [])
      expect(result.party.fspId).toMatch(/^[A-Z0-9]{1,32}$/)
    })

    it('should generate valid FSP IDs in arrays', async () => {
      mockGenerator.schema.paths['/test'].post.requestBody.content['application/json'].schema = {
        type: 'object',
        properties: {
          participants: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fspId: { type: 'string', format: 'fsp-id' }
              }
            }
          }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post', [])
      expect(Array.isArray(result.participants)).toBe(true)
      result.participants.forEach(participant => {
        expect(participant.fspId).toMatch(/^[A-Z0-9]{1,32}$/)
      })
    })
  })

  describe('postProcessMock Functionality', () => {
    it('should process state and reason fields correctly', async () => {
      mockGenerator.schema.paths['/test'].post.requestBody.content['application/json'].schema = {
        type: 'object',
        properties: {
          state: { type: 'string' },
          reason: { type: 'string' }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post', [
        { id: 'state', pattern: 'Created|Closed' },
        { id: 'reason', pattern: 'Created|Closed' }
      ])
      expect(['Created', 'Closed']).toContain(result.state)
      expect(['Created', 'Closed']).toContain(result.reason)
    })

    it('should process partyIdType fields correctly', async () => {
      mockGenerator.schema.paths['/test'].post.requestBody.content['application/json'].schema = {
        type: 'object',
        properties: {
          partyIdType: { type: 'string' }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post', [])
      expect(['PERSONAL_ID', 'BUSINESS_ID']).toContain(result.partyIdType)
    })

    it('should process transferState fields correctly', async () => {
      mockGenerator.schema.paths['/test'].post.requestBody.content['application/json'].schema = {
        type: 'object',
        properties: {
          transferState: { type: 'string' }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post', [])
      expect(['RECEIVED', 'RESERVED', 'COMMITTED', 'ABORTED']).toContain(result.transferState)
    })

    it('should process name fields correctly', async () => {
      mockGenerator.schema.paths['/test'].post.requestBody.content['application/json'].schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post', [])
      expect(result.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
      expect(result.firstName).toMatch(/^[A-Z][a-z]+$/)
      expect(result.lastName).toMatch(/^[A-Z][a-z]+$/)
    })

    it('should process currency fields correctly', async () => {
      mockGenerator.schema.paths['/test'].post.requestBody.content['application/json'].schema = {
        type: 'object',
        properties: {
          currency: { type: 'string' },
          amount: {
            type: 'object',
            properties: {
              currency: { type: 'string' },
              amount: { type: 'string' }
            }
          }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post', [])
      expect(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BRL']).toContain(result.currency)
      expect(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BRL']).toContain(result.amount.currency)
      expect(result.amount.amount).toMatch(/^\d+\.\d{2}$/)
    })

    it('should process partyIdentifier fields correctly', async () => {
      mockGenerator.schema.paths['/test'].post.requestBody.content['application/json'].schema = {
        type: 'object',
        properties: {
          partyIdentifier: { type: 'string' }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post', [])
      expect(result.partyIdentifier).toMatch(/^\d{10,15}$/)
    })

    it('should process date-time fields correctly', async () => {
      mockGenerator.schema.paths['/test'].post.requestBody.content['application/json'].schema = {
        type: 'object',
        properties: {
          dateTime: { type: 'string', format: 'date-time' },
          date: { type: 'string', format: 'date' }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post', [])
      expect(result.dateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should process geo coordinates correctly', async () => {
      mockGenerator.schema.paths['/test'].post.requestBody.content['application/json'].schema = {
        type: 'object',
        properties: {
          latitude: { type: 'string', format: 'geo-latitude' },
          longitude: { type: 'string', format: 'geo-longitude' }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post', [])
      expect(result.latitude).toMatch(/^[+-]\d+\.\d{4}$/)
      expect(result.longitude).toMatch(/^[+-]\d+\.\d{4}$/)
      expect(parseFloat(result.latitude)).toBeGreaterThanOrEqual(-90)
      expect(parseFloat(result.latitude)).toBeLessThanOrEqual(90)
      expect(parseFloat(result.longitude)).toBeGreaterThanOrEqual(-180)
      expect(parseFloat(result.longitude)).toBeLessThanOrEqual(180)
    })
  })
})

describe('Header Generation', () => {
  it('should generate specific HTTP headers with correct formats', async () => {
    const mockGenerator = new OpenApiMockGenerator()

    // Mock the schema.paths property for the OpenApiRequestGenerator
    mockGenerator.schema = {
      paths: {
        '/test': {
          get: {
            operationId: 'testOperation',
            parameters: [
              {
                in: 'header',
                name: 'accept',
                schema: { type: 'string' }
              },
              {
                in: 'header',
                name: 'content-type',
                schema: { type: 'string' }
              },
              {
                in: 'header',
                name: 'date',
                schema: { type: 'string' }
              },
              {
                in: 'header',
                name: 'x-forwarded-for',
                schema: { type: 'string' }
              },
              {
                in: 'header',
                name: 'fspiop-source',
                schema: { type: 'string' }
              },
              {
                in: 'header',
                name: 'fspiop-destination',
                schema: { type: 'string' }
              },
              {
                in: 'header',
                name: 'fspiop-encryption',
                schema: { type: 'string' }
              },
              {
                in: 'header',
                name: 'fspiop-signature',
                schema: { type: 'string' }
              },
              {
                in: 'header',
                name: 'fspiop-uri',
                schema: { type: 'string' }
              },
              {
                in: 'header',
                name: 'fspiop-http-method',
                schema: { type: 'string' }
              }
            ]
          }
        }
      }
    }

    const headers = await mockGenerator.generateRequestHeaders('/test', 'get', [])

    expect(headers.accept).toBe('application/vnd.interoperability.transactionRequests+json;version=1')
    expect(headers['content-type']).toBe('application/vnd.interoperability.transactionRequests+json;version=1.1')
    expect(typeof headers.date).toBe('string')
    expect(headers.date).toMatch(/^\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/)
    expect(headers['x-forwarded-for']).toBe('in')
    expect(headers['fspiop-source']).toBe('magna')
    expect(headers['fspiop-destination']).toBe('culpa magna proident')
    expect(headers['fspiop-encryption']).toBe('voluptate incididunt ut sed')
    expect(headers['fspiop-signature']).toBe('non Lorem consequat')
    expect(headers['fspiop-uri']).toBe('labore')
    expect(headers['fspiop-http-method']).toBe('Duis id')
  })
})
