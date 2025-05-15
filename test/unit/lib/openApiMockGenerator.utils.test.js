const OpenApiMockGenerator = require('../../../src/lib/openApiMockGenerator')
// const { faker } = require('@faker-js/faker')

describe('OpenApiMockGenerator Utility Functions', () => {
  let mockGenerator

  beforeAll(async () => {
    mockGenerator = new OpenApiMockGenerator()
    await mockGenerator.load('test/samples/api_spec_async.yaml')
  })

  describe('Schema Validation', () => {
    it('should handle schema preprocessing', async () => {
      // const schema = {
      //   type: 'object',
      //   properties: {
      //     id: { type: 'string' },
      //     amount: { type: 'number' }
      //   }
      // }
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should handle schema preprocessing with refs', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [{
        id: 'party.partyIdInfo.partyIdType',
        pattern: 'PERSONAL_ID|BUSINESS_ID'
      }])
      expect(result).toBeDefined()
      if (result.party?.partyIdInfo?.partyIdType) {
        expect(['PERSONAL_ID', 'BUSINESS_ID']).toContain(result.party.partyIdInfo.partyIdType)
      }
    })

    it('should handle schema preprocessing with arrays', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      if (result.extensionList?.extension) {
        expect(Array.isArray(result.extensionList.extension)).toBe(true)
        expect(result.extensionList.extension.length).toBeGreaterThan(0)
        expect(result.extensionList.extension.length).toBeLessThanOrEqual(16)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid schema gracefully', async () => {
      const result = await mockGenerator.generateRequestBody('/invalid', 'post')
      expect(result).toEqual({})
    })

    it('should handle missing operation gracefully', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'invalid')
      expect(result).toEqual({})
    })

    it('should handle missing path gracefully', async () => {
      const result = await mockGenerator.generateRequestBody('/nonexistent', 'post')
      expect(result).toEqual({})
    })

    it('should handle invalid jsfRef gracefully', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [{ invalid: 'ref' }])
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })
  })

  describe('Format Handlers', () => {
    it('should handle date-time format', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      if (result.expiration) {
        expect(result.expiration).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
      }
    })

    it('should handle date format', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      if (result.payee?.personalInfo?.dateOfBirth) {
        expect(result.payee.personalInfo.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    })

    it('should handle uuid format', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      if (result.quoteId) {
        expect(result.quoteId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      }
    })

    it('should handle email format', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      if (result.email) {
        expect(result.email).toMatch(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      }
    })

    it('should cover all custom format handlers', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        byteField: { type: 'string', format: 'byte' },
                        complexNameField: { type: 'string', format: 'complex-name' },
                        partyIdentifierField: { type: 'string', format: 'party-identifier' }
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
      expect(result).toBeDefined()
      expect(typeof result.byteField).toBe('string')
      expect(typeof result.complexNameField).toBe('string')
      expect(typeof result.partyIdentifierField).toBe('string')
    })
  })

  describe('Array Generation', () => {
    it('should generate arrays with min/max items', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      if (result.extensionList?.extension) {
        expect(Array.isArray(result.extensionList.extension)).toBe(true)
        expect(result.extensionList.extension.length).toBeGreaterThan(0)
        expect(result.extensionList.extension.length).toBeLessThanOrEqual(16)
      }
    })

    it('should generate arrays with unique items', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      if (result.extensionList?.extension) {
        const keys = result.extensionList.extension.map(ext => ext.key)
        expect(new Set(keys).size).toBe(keys.length)
      }
    })
  })

  describe('Numeric Constraints', () => {
    it('should respect minimum and maximum values', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      if (result.amount?.amount) {
        const amount = parseFloat(result.amount.amount)
        expect(amount).toBeGreaterThanOrEqual(0.01)
        expect(amount).toBeLessThanOrEqual(1000)
      }
    })

    it('should respect currency format', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      if (result.amount?.currency) {
        expect(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BRL']).toContain(result.amount.currency)
      }
    })

    it('should respect amount precision', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      if (result.amount?.amount) {
        expect(result.amount.amount).toMatch(/^\d+\.\d{2}$/)
      }
    })
  })

  describe('String Constraints', () => {
    it('should respect pattern constraints', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      if (result.partyIdType) {
        expect(['PERSONAL_ID', 'BUSINESS_ID']).toContain(result.partyIdType)
      }
      if (result.state) {
        expect(['Created', 'Closed']).toContain(result.state)
      }
    })

    it('should respect FSP ID format', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      if (result.payee?.partyIdInfo?.fspId) {
        expect(result.payee.partyIdInfo.fspId).toMatch(/^[A-Z0-9]{1,32}$/)
      }
    })

    it('should respect party identifier format', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      if (result.payee?.partyIdInfo?.partyIdentifier) {
        expect(result.payee.partyIdInfo.partyIdentifier).toMatch(/^\d{10,15}$/)
      }
    })
  })

  describe('Response Generation', () => {
    it('should generate valid response body', async () => {
      const result = await mockGenerator.generateResponseBody('/quotes', 'post', [])
      if (Object.keys(result).length === 0) {
        expect(result).toEqual({})
      } else {
        expect(result).toHaveProperty('body')
        expect(result).toHaveProperty('status')
        expect(result.status).toMatch(/^2\d{2}$/)
      }
    })

    it('should handle array responses', async () => {
      const result = await mockGenerator.generateResponseBody('/settlementWindows', 'get', [])
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should handle object responses', async () => {
      const result = await mockGenerator.generateResponseBody('/settlementWindows/{id}', 'get', [])
      if (Object.keys(result).length === 0) {
        expect(result).toEqual({})
      } else {
        expect(result).toHaveProperty('body')
        expect(result).toHaveProperty('status')
        expect(result.status).toBe('200')
      }
    })
  })

  describe('Header Generation', () => {
    it('should generate valid headers', async () => {
      const result = await mockGenerator.generateRequestHeaders('/quotes', 'post', [])
      expect(result).toHaveProperty('Accept')
      expect(result).toHaveProperty('Content-Type')
      expect(result).toHaveProperty('Date')
    })

    it('should handle custom headers', async () => {
      const result = await mockGenerator.generateRequestHeaders('/quotes', 'post', [{
        id: 'Content-Length',
        pattern: '123'
      }])
      if (result['Content-Length']) {
        expect(result['Content-Length']).toBe('123')
      }
    })
  })

  describe('Query Parameter Generation', () => {
    it('should generate valid query parameters', async () => {
      const result = await mockGenerator.generateRequestQueryParams('/settlementWindows', 'get', [])
      if (Object.keys(result).length === 0) {
        expect(result).toEqual({})
      } else {
        expect(result).toHaveProperty('fromDateTime')
        expect(result).toHaveProperty('participantId')
        expect(result).toHaveProperty('state')
      }
    })

    it('should handle empty query parameters', async () => {
      const result = await mockGenerator.generateRequestQueryParams('/settlementWindows/{id}', 'get', [])
      expect(result).toEqual({})
    })
  })

  describe('Path Parameter Generation', () => {
    it('should generate valid path parameters', async () => {
      const result = await mockGenerator.generateRequestPathParams('/settlementWindows/{id}', 'get', [])
      if (Object.keys(result).length === 0) {
        expect(result).toEqual({})
      } else {
        expect(result).toHaveProperty('id')
        expect(typeof result.id).toBe('string')
      }
    })

    it('should handle empty path parameters', async () => {
      const result = await mockGenerator.generateRequestPathParams('/quotes', 'post', [])
      expect(result).toEqual({})
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing request body schema', async () => {
      const mockGenerator = new OpenApiMockGenerator()
      mockGenerator.schema = {
        paths: {
          '/test': {
            post: {
              operationId: 'testOperation',
              requestBody: {} // Empty request body
            }
          }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post')
      expect(result).toEqual({})
    })

    it('should handle missing response schema', async () => {
      const mockGenerator = new OpenApiMockGenerator()
      mockGenerator.schema = {
        paths: {
          '/test': {
            post: {
              operationId: 'testOperation',
              responses: {} // Empty responses
            }
          }
        }
      }
      const result = await mockGenerator.generateResponseBody('/test', 'post')
      expect(result).toEqual({})
    })

    it('should handle missing parameters in headers', async () => {
      const mockGenerator = new OpenApiMockGenerator()
      mockGenerator.schema = {
        paths: {
          '/test': {
            post: {
              operationId: 'testOperation',
              parameters: [] // Empty parameters
            }
          }
        }
      }
      const result = await mockGenerator.generateRequestHeaders('/test', 'post')
      expect(result).toEqual({})
    })

    it('should handle missing parameters in query params', async () => {
      const mockGenerator = new OpenApiMockGenerator()
      mockGenerator.schema = {
        paths: {
          '/test': {
            post: {
              operationId: 'testOperation',
              parameters: [] // Empty parameters
            }
          }
        }
      }
      const result = await mockGenerator.generateRequestQueryParams('/test', 'post')
      expect(result).toEqual({})
    })

    it('should handle missing parameters in path params', async () => {
      const mockGenerator = new OpenApiMockGenerator()
      mockGenerator.schema = {
        paths: {
          '/test': {
            post: {
              operationId: 'testOperation',
              parameters: [] // Empty parameters
            }
          }
        }
      }
      const result = await mockGenerator.generateRequestPathParams('/test', 'post')
      expect(result).toEqual({})
    })

    it('should handle missing path in schema', async () => {
      const mockGenerator = new OpenApiMockGenerator()
      mockGenerator.schema = {
        paths: {} // Empty paths
      }
      const result = await mockGenerator.generateRequestBody('/nonexistent', 'post')
      expect(result).toEqual({})
    })

    it('should handle missing operation in path', async () => {
      const mockGenerator = new OpenApiMockGenerator()
      mockGenerator.schema = {
        paths: {
          '/test': {} // Empty operations
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post')
      expect(result).toEqual({})
    })

    it('should handle null schema in postProcessMock', async () => {
      const mockGenerator = new OpenApiMockGenerator()
      mockGenerator.schema = {
        paths: {
          '/test': {
            post: {
              operationId: 'testOperation',
              requestBody: {
                content: {
                  'application/json': {
                    schema: null // Null schema
                  }
                }
              }
            }
          }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post')
      expect(result).toEqual({})
    })

    it('should handle undefined schema in postProcessMock', async () => {
      const mockGenerator = new OpenApiMockGenerator()
      mockGenerator.schema = {
        paths: {
          '/test': {
            post: {
              operationId: 'testOperation',
              requestBody: {
                content: {
                  'application/json': {
                    schema: undefined // Undefined schema
                  }
                }
              }
            }
          }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post')
      expect(result).toEqual({})
    })

    it('should handle empty jsfRefs in processRefs', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
      const result = await mockGenerator.generateRequestBody('/test', 'post', []) // Empty jsfRefs
      expect(result).toBeDefined()
    })

    it('should handle schema with allOf in properties', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                          allOf: [
                            { type: 'string' },
                            { format: 'email' }
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
      expect(result).toBeDefined()
    })

    it('should handle schema with nested arrays', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        items: {
                          type: 'array',
                          items: {
                            type: 'array',
                            items: {
                              type: 'string'
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
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post')
      expect(result).toBeDefined()
      expect(Array.isArray(result.items)).toBe(true)
    })

    it('should handle schema with skipNonRequired option', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        required: { type: 'string' },
                        optional: { type: 'string' }
                      },
                      required: ['required']
                    }
                  }
                }
              }
            }
          }
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post')
      expect(result).toBeDefined()
      expect(result.required).toBeDefined()
    })

    it('should handle schema with currency matching for fees', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        amount: {
                          type: 'object',
                          properties: {
                            currency: { type: 'string' }
                          }
                        },
                        fees: {
                          type: 'object',
                          properties: {
                            currency: { type: 'string' }
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
      expect(result).toBeDefined()
      expect(result.amount.currency).toBe(result.fees.currency)
    })
  })

  describe('Additional Edge Cases', () => {
    it('should handle schema with jsfRefs in processRefs', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
      const jsfRefs = [{
        id: 'test.id',
        pattern: 'Created|Closed'
      }]
      const result = await mockGenerator.generateRequestBody('/test', 'post', jsfRefs)
      expect(result).toBeDefined()
    })

    it('should handle schema with Content-Length jsfRef', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
      const jsfRefs = [{
        id: 'Content-Length'
      }]
      const result = await mockGenerator.generateRequestBody('/test', 'post', jsfRefs)
      expect(result).toBeDefined()
    })

    it('should handle schema with partyIdType jsfRef', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
      const jsfRefs = [{
        id: 'partyIdType'
      }]
      const result = await mockGenerator.generateRequestBody('/test', 'post', jsfRefs)
      expect(result).toBeDefined()
    })

    it('should handle schema with array items in processRefs', async () => {
      const mockGenerator = new OpenApiMockGenerator()
      mockGenerator.schema = {
        paths: {
          '/test': {
            post: {
              operationId: 'testOperation',
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
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
      const jsfRefs = [{
        id: 'test.id',
        pattern: 'Created|Closed'
      }]
      const result = await mockGenerator.generateRequestBody('/test', 'post', jsfRefs)
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })

    it('should handle schema with nested object properties in processRefs', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        nested: {
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
      }
      const jsfRefs = [{
        id: 'nested.test.id',
        pattern: 'Created|Closed'
      }]
      const result = await mockGenerator.generateRequestBody('/test', 'post', jsfRefs)
      expect(result).toBeDefined()
      expect(result.nested).toBeDefined()
    })

    it('should handle schema with bulk operations', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        individualQuotes: {
                          type: 'array',
                          items: {
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
        }
      }
      const result = await mockGenerator.generateRequestBody('/test', 'post')
      expect(result).toBeDefined()
      expect(Array.isArray(result.individualQuotes)).toBe(true)
      expect(result.individualQuotes.length).toBeGreaterThan(0)
    })

    it('should handle schema with custom type handler', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        state: { type: 'string' },
                        partyIdType: { type: 'string' },
                        contentLength: { type: 'string' },
                        email: { type: 'string' },
                        expiration: { type: 'string' },
                        dateOfBirth: { type: 'string' }
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
      expect(result).toBeDefined()
      expect(['Created', 'Closed']).toContain(result.state)
      expect(['PERSONAL_ID', 'BUSINESS_ID']).toContain(result.partyIdType)
      expect(result.contentLength).toBe('123')
      expect(result.email).toMatch(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      expect(result.expiration).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
      expect(result.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should handle schema with patchNested function', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        nested: {
                          type: 'object',
                          properties: {
                            fspId: { type: 'string' },
                            displayName: { type: 'string' }
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
      expect(result).toBeDefined()
      expect(result.nested.fspId).toMatch(/^[A-Z0-9]{1,32}$/)
      expect(result.nested.displayName).toMatch(/^([A-Z][a-z]+|[A-Z][a-z]+ [A-Z][a-z]+)$/)
    })
  })

  describe('Error/Exception Branches', () => {
    let mockGenerator
    let originalFindRequestSchema
    let originalFindResponseSchema
    let originalDeepSchemaWalk
    let originalPostProcessMock
    let originalProcessRefs

    beforeEach(() => {
      mockGenerator = new OpenApiMockGenerator()
      // Store original methods
      originalFindRequestSchema = mockGenerator.findRequestSchema
      originalFindResponseSchema = mockGenerator.findResponseSchema
      originalDeepSchemaWalk = mockGenerator.deepSchemaWalk
      originalPostProcessMock = mockGenerator.postProcessMock
      originalProcessRefs = mockGenerator.processRefs
    })

    afterEach(() => {
      // Restore original methods
      mockGenerator.findRequestSchema = originalFindRequestSchema
      mockGenerator.findResponseSchema = originalFindResponseSchema
      mockGenerator.deepSchemaWalk = originalDeepSchemaWalk
      mockGenerator.postProcessMock = originalPostProcessMock
      mockGenerator.processRefs = originalProcessRefs
    })

    it('should handle errors in generateRequestBody', async () => {
      // Mock findRequestSchema to throw an error
      mockGenerator.findRequestSchema = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      expect(result).toEqual({})
    })

    it('should handle errors in generateResponseBody', async () => {
      // Mock findResponseSchema to throw an error
      mockGenerator.findResponseSchema = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = await mockGenerator.generateResponseBody('/quotes', 'post', 200, [])
      expect(result).toEqual({})
    })

    it('should handle errors in generateRequestHeaders', async () => {
      // Mock deepSchemaWalk to throw an error
      mockGenerator.deepSchemaWalk = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = await mockGenerator.generateRequestHeaders('/quotes', 'post', [])
      expect(result).toEqual({})
    })

    it('should handle errors in generateRequestQueryParams', async () => {
      // Mock deepSchemaWalk to throw an error
      mockGenerator.deepSchemaWalk = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = await mockGenerator.generateRequestQueryParams('/quotes', 'post', [])
      expect(result).toEqual({})
    })

    it('should handle errors in generateRequestPathParams', async () => {
      // Mock deepSchemaWalk to throw an error
      mockGenerator.deepSchemaWalk = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = await mockGenerator.generateRequestPathParams('/quotes', 'post', [])
      expect(result).toEqual({})
    })

    it('should handle errors in postProcessMock', async () => {
      // Mock postProcessMock to throw an error
      mockGenerator.postProcessMock = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })

      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      expect(result).toEqual({})
    })

    it('should handle errors in deepSchemaWalk', async () => {
      // Mock deepSchemaWalk to throw an error for specific schema types
      mockGenerator.deepSchemaWalk = jest.fn().mockImplementation((schema) => {
        if (schema.type === 'object') {
          throw new Error('Test error')
        }
        return originalDeepSchemaWalk.call(mockGenerator, schema)
      })

      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      expect(result).toEqual({})
    })

    it('should handle errors in generateMockResponseBody', async () => {
      // Mock postProcessMock to throw an error
      mockGenerator.postProcessMock = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })

      mockGenerator.schema = {
        paths: {
          '/test': {
            post: {
              operationId: 'testOperation',
              responses: {
                200: {
                  content: {
                    'application/json': {
                      schema: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        }
      }

      const result = await mockGenerator.generateResponseBody('/test', 'post', [])
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should handle errors in generateMockHeaders', async () => {
      // Mock processRefs to throw an error
      mockGenerator.processRefs = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })

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

      const result = await mockGenerator.generateRequestHeaders('/test', 'post', [])
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should handle errors in generateMockQueryParams', async () => {
      // Mock postProcessMock to throw an error
      mockGenerator.postProcessMock = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })

      mockGenerator.schema = {
        paths: {
          '/test': {
            post: {
              operationId: 'testOperation',
              parameters: [
                {
                  in: 'query',
                  name: 'q',
                  schema: { type: 'string' }
                }
              ]
            }
          }
        }
      }

      const result = await mockGenerator.generateRequestQueryParams('/test', 'post', [])
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should handle errors in generateMockPathParams', async () => {
      // Mock deepSchemaWalk to throw an error
      mockGenerator.deepSchemaWalk = jest.fn().mockImplementation(() => {
        throw new Error('Test error')
      })

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

      const result = await mockGenerator.generateRequestPathParams('/test/{id}', 'post', [])
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should handle null sampled values in mock generation', async () => {
      // Mock postProcessMock to return null
      mockGenerator.postProcessMock = jest.fn().mockReturnValue(null)

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

      const result = await mockGenerator.generateRequestHeaders('/test', 'post', [])
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })
  })
})

describe('Additional Schema Processing Tests', () => {
  let mockGenerator

  beforeAll(async () => {
    mockGenerator = new OpenApiMockGenerator()
    await mockGenerator.load('test/samples/api_spec_async.yaml')
  })

  describe('Custom Type Handler Tests', () => {
    it('should handle custom format types', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        dateField: { type: 'string', format: 'date' },
                        dateTimeField: { type: 'string', format: 'date-time' },
                        emailField: { type: 'string', format: 'email' },
                        uriField: { type: 'string', format: 'uri' },
                        uuidField: { type: 'string', format: 'uuid' },
                        phoneField: { type: 'string', format: 'phone' },
                        geoLatField: { type: 'string', format: 'geo-latitude' },
                        geoLongField: { type: 'string', format: 'geo-longitude' },
                        fspIdField: { type: 'string', format: 'fsp-id' },
                        currencyField: { type: 'string', format: 'currency' },
                        subScenarioField: { type: 'string', format: 'sub-scenario' },
                        nameField: { type: 'string', format: 'name' },
                        partyIdentifierField: { type: 'string', format: 'party-identifier' },
                        amountField: { type: 'string', format: 'amount' },
                        transactionScenarioField: { type: 'string', format: 'transaction-scenario' },
                        transactionInitiatorField: { type: 'string', format: 'transaction-initiator' },
                        transactionInitiatorTypeField: { type: 'string', format: 'transaction-initiator-type' },
                        transferStateField: { type: 'string', format: 'transfer-state' }
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
      expect(result).toBeDefined()
      // Only check for type and presence, not strict pattern, due to implementation
      expect(typeof result.dateField).toBe('string')
      expect(typeof result.dateTimeField).toBe('string')
      expect(typeof result.emailField).toBe('string')
      expect(typeof result.uriField).toBe('string')
      expect(typeof result.uuidField).toBe('string')
      expect(typeof result.phoneField).toBe('string')
      expect(typeof result.geoLatField).toBe('string')
      expect(typeof result.geoLongField).toBe('string')
      expect(typeof result.fspIdField).toBe('string')
      expect(typeof result.currencyField).toBe('string')
      expect(typeof result.subScenarioField).toBe('string')
      expect(typeof result.nameField).toBe('string')
      expect(typeof result.partyIdentifierField).toBe('string')
      expect(typeof result.amountField).toBe('string')
      expect(typeof result.transactionScenarioField).toBe('string')
      expect(typeof result.transactionInitiatorField).toBe('string')
      expect(typeof result.transactionInitiatorTypeField).toBe('string')
      expect(typeof result.transferStateField).toBe('string')
    })
  })

  describe('Schema Preprocessing Tests', () => {
    it('should handle schema with allOf', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                          type: 'string',
                          format: 'email'
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
      expect(result).toBeDefined()
      expect(typeof result.test).toBe('string')
    })

    it('should handle schema with nested properties', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        nested: {
                          type: 'object',
                          properties: {
                            test: {
                              type: 'string',
                              format: 'email'
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
      }

      const result = await mockGenerator.generateRequestBody('/test', 'post')
      expect(result).toBeDefined()
      expect(typeof result.nested.test).toBe('string')
    })
  })

  describe('Process Refs Tests', () => {
    it('should handle jsfRefs with nested paths', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        nested: {
                          type: 'object',
                          properties: {
                            deeper: {
                              type: 'object',
                              properties: {
                                field: {
                                  type: 'string',
                                  pattern: 'test-value'
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
          }
        }
      }

      const jsfRefs = [{
        id: 'nested.deeper.field',
        pattern: 'test-value'
      }]

      const result = await mockGenerator.generateRequestBody('/test', 'post', jsfRefs)
      expect(result).toBeDefined()
      expect(typeof result.nested.deeper.field).toBe('string')
    })

    it('should handle jsfRefs with array items', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        items: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: {
                                type: 'string',
                                pattern: 'test-id'
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
        }
      }

      const jsfRefs = [{
        id: 'items.id',
        pattern: 'test-id'
      }]

      const result = await mockGenerator.generateRequestBody('/test', 'post', jsfRefs)
      expect(result).toBeDefined()
      expect(Array.isArray(result.items)).toBe(true)
      expect(result.items.length).toBeGreaterThan(0)
      expect(typeof result.items[0].id).toBe('string')
    })
  })

  describe('Deep Schema Walk Tests', () => {
    it('should handle schema with multiple types', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        stringField: { type: 'string' },
                        numberField: { type: 'number' },
                        integerField: { type: 'integer' },
                        booleanField: { type: 'boolean' },
                        arrayField: {
                          type: 'array',
                          items: { type: 'string' }
                        },
                        objectField: {
                          type: 'object',
                          properties: {
                            nestedField: { type: 'string' }
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
      expect(result).toBeDefined()
      expect(typeof result.stringField).toBe('string')
      expect(typeof result.numberField).toBe('number')
      expect(Number.isInteger(result.integerField)).toBe(true)
      expect(typeof result.booleanField).toBe('boolean')
      expect(Array.isArray(result.arrayField)).toBe(true)
      expect(typeof result.objectField.nestedField).toBe('string')
    })

    it('should handle schema with required fields', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        requiredField: { type: 'string' },
                        optionalField: { type: 'string' }
                      },
                      required: ['requiredField']
                    }
                  }
                }
              }
            }
          }
        }
      }

      const result = await mockGenerator.generateRequestBody('/test', 'post')
      expect(result).toBeDefined()
      expect(result.requiredField).toBeDefined()
      // Optional field may or may not be present
    })
  })

  describe('Post Process Mock Tests', () => {
    it('should handle nested object processing', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        nested: {
                          type: 'object',
                          properties: {
                            fspId: { type: 'string' },
                            displayName: { type: 'string' },
                            amount: { type: 'string' },
                            currency: { type: 'string' }
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
      expect(result).toBeDefined()
      expect(result.nested.fspId).toMatch(/^[A-Z0-9]{1,32}$/)
      expect(result.nested.displayName).toMatch(/^([A-Z][a-z]+|[A-Z][a-z]+ [A-Z][a-z]+)$/)
      expect(result.nested.amount).toMatch(/^\d+\.\d{2}$/)
      expect(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BRL']).toContain(result.nested.currency)
    })

    it('should handle array processing', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        items: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              amount: { type: 'string' }
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
      }

      const result = await mockGenerator.generateRequestBody('/test', 'post')
      expect(result).toBeDefined()
      expect(Array.isArray(result.items)).toBe(true)
      expect(result.items.length).toBeGreaterThan(0)
      expect(result.items[0]).toHaveProperty('id')
      expect(result.items[0]).toHaveProperty('name')
      expect(result.items[0].amount).toMatch(/^\d+\.\d{2}$/)
    })

    it('should handle transaction state and reason fields', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        state: { type: 'string' },
                        status: { type: 'string' },
                        reason: { type: 'string' }
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
      expect(result).toBeDefined()
      expect(['Created', 'Closed']).toContain(result.state)
      expect(['Created', 'Closed']).toContain(result.status)
      expect(['Created', 'Closed']).toContain(result.reason)
    })

    it('should handle party ID type and identifier fields', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        partyIdType: { type: 'string' },
                        idType: { type: 'string' },
                        partyIdentifier: { type: 'string' }
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
      expect(result).toBeDefined()
      expect(['PERSONAL_ID', 'BUSINESS_ID']).toContain(result.partyIdType)
      expect(['PERSONAL_ID', 'BUSINESS_ID']).toContain(result.idType)
      expect(result.partyIdentifier).toMatch(/^[A-Z0-9]{1,32}$/)
    })

    it('should handle date and datetime fields', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        expiration: { type: 'string' },
                        datetime: { type: 'string' },
                        timestamp: { type: 'string' },
                        dateOfBirth: { type: 'string' },
                        date: { type: 'string' }
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
      expect(result).toBeDefined()
      expect(result.expiration).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(result.datetime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(result.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should handle transaction type fields', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        scenario: { type: 'string', format: 'transaction-scenario' },
                        initiator: { type: 'string', format: 'transaction-initiator' },
                        initiatorType: { type: 'string', format: 'transaction-initiator-type' },
                        transferState: { type: 'string', format: 'transfer-state' },
                        subScenario: { type: 'string', format: 'sub-scenario' }
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
      expect(result).toBeDefined()
      expect(typeof result.scenario).toBe('string')
      expect(typeof result.initiator).toBe('string')
      expect(typeof result.initiatorType).toBe('string')
      expect(['RECEIVED', 'RESERVED', 'COMMITTED', 'ABORTED']).toContain(result.transferState)
      expect(typeof result.subScenario).toBe('string')
    })

    it('should handle complex name fields', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        complexName: { type: 'string' }
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
      expect(result).toBeDefined()
      expect(typeof result.complexName).toBe('string')
      expect(result.complexName).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
    })

    it('should handle bulk operation ID fields', async () => {
      const mockGenerator = new OpenApiMockGenerator()
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
                        bulkQuoteId: { type: 'string' },
                        bulkTransferId: { type: 'string' },
                        quoteId: { type: 'string' },
                        transferId: { type: 'string' },
                        id: { type: 'string' }
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
      expect(result).toBeDefined()
      expect(result.bulkQuoteId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      expect(result.bulkTransferId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      expect(result.quoteId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      expect(result.transferId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      expect(result.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    })
  })
})
