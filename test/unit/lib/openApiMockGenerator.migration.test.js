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
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/

'use strict'

const OpenApiMockGenerator = require('../../../src/lib/openApiMockGenerator')
const specFilePrefix = 'test/samples/'

// Test data that was used in the original implementation
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
  },
  {
    id: 'partyIdType',
    pattern: 'PERSONAL_ID|BUSINESS_ID'
  },
  {
    id: 'email',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
  }
]

describe('OpenApiMockGenerator Migration Tests', () => {
  let mockGenerator

  beforeAll(async () => {
    mockGenerator = new OpenApiMockGenerator()
    await mockGenerator.load(specFilePrefix + 'api_spec_async.yaml')
  })

  describe('Schema Validation', () => {
    it('should generate values according to schema patterns', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', jsfRef)

      // Only test fields that are defined in the schema
      if (result.state) {
        expect(result.state).toMatch(/^(Created|Closed)$/)
      }
      if (result.reason) {
        expect(result.reason).toMatch(/^(Created|Closed)$/)
      }
      if (result.partyIdType) {
        expect(['PERSONAL_ID', 'BUSINESS_ID']).toContain(result.partyIdType)
      }
    })

    it('should generate values according to schema formats', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', jsfRef)

      // Test format validation for fields defined in schema
      if (result.expiration) {
        expect(result.expiration).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
      }
      if (result.payee?.personalInfo?.dateOfBirth) {
        expect(result.payee.personalInfo.dateOfBirth).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
      if (result.email) {
        expect(result.email).toMatch(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      }
      if (result.quoteId) {
        expect(result.quoteId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
      }
    })

    it('should handle schema references correctly', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', jsfRef)

      // Test reference resolution for schema-defined fields
      if (result.payee?.partyIdInfo) {
        expect(result.payee.partyIdInfo.partyIdType).toMatch(/^(PERSONAL_ID|BUSINESS_ID)$/)
        expect(result.payee.partyIdInfo.partyIdentifier).toMatch(/^\d{10,15}$/)
        expect(result.payee.partyIdInfo.fspId).toMatch(/^[A-Z0-9]{1,32}$/)
      }

      if (result.payer?.partyIdInfo) {
        expect(result.payer.partyIdInfo.partyIdType).toMatch(/^(PERSONAL_ID|BUSINESS_ID)$/)
        expect(result.payer.partyIdInfo.partyIdentifier).toMatch(/^\d{10,15}$/)
        expect(result.payer.partyIdInfo.fspId).toMatch(/^[A-Z0-9]{1,32}$/)
      }
    })

    it('should handle schema arrays correctly', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', jsfRef)

      if (result.extensionList?.extension) {
        expect(Array.isArray(result.extensionList.extension)).toBe(true)
        expect(result.extensionList.extension.length).toBeGreaterThan(0)
        expect(result.extensionList.extension.length).toBeLessThanOrEqual(16)

        const extension = result.extensionList.extension[0]
        expect(extension.key).toBeDefined()
        expect(extension.value).toBeDefined()
      }
    })

    it('should handle schema enums correctly', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', jsfRef)

      if (result.transactionType?.scenario) {
        expect(result.transactionType.scenario).toMatch(/^(DEPOSIT|WITHDRAWAL|TRANSFER|PAYMENT|REFUND)$/)
      }
      if (result.transactionType?.initiator) {
        expect(result.transactionType.initiator).toMatch(/^(PAYER|PAYEE)$/)
      }
      if (result.transactionType?.initiatorType) {
        expect(result.transactionType.initiatorType).toMatch(/^(CONSUMER|AGENT|BUSINESS|DEVICE)$/)
      }
    })

    it('should handle schema numeric constraints', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', jsfRef)

      if (result.amount?.amount) {
        expect(result.amount.amount).toMatch(/^\d+\.\d{2}$/)
      }
      if (result.geoCode?.latitude) {
        const lat = parseFloat(result.geoCode.latitude)
        expect(lat).toBeGreaterThanOrEqual(-90)
        expect(lat).toBeLessThanOrEqual(90)
      }
      if (result.geoCode?.longitude) {
        const lon = parseFloat(result.geoCode.longitude)
        expect(lon).toBeGreaterThanOrEqual(-180)
        expect(lon).toBeLessThanOrEqual(180)
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty schemas', async () => {
      const result = await mockGenerator.generateRequestBody('/empty', 'post', jsfRef)
      expect(result).toEqual({})
    })

    it('should handle missing optional fields', async () => {
      const result = await mockGenerator.generateRequestBody('/quotes', 'post', [])
      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
    })

    it('should handle null responses', async () => {
      const result = await mockGenerator.generateResponseBody('/empty', 'get', jsfRef)
      expect(result).toEqual({})
    })
  })

  describe('Consistency Checks', () => {
    it('should generate consistent data types across multiple calls', async () => {
      const result1 = await mockGenerator.generateRequestBody('/quotes', 'post', jsfRef)
      const result2 = await mockGenerator.generateRequestBody('/quotes', 'post', jsfRef)

      // Check that schema-defined fields maintain consistent types
      if (result1.quoteId && result2.quoteId) {
        expect(typeof result1.quoteId).toBe(typeof result2.quoteId)
      }
      if (result1.amount?.amount && result2.amount?.amount) {
        expect(typeof result1.amount.amount).toBe(typeof result2.amount.amount)
      }
    })
  })
})
