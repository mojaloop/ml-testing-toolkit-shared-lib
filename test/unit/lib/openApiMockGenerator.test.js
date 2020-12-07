/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation

 * ModusBox
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com>
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/

'use strict'
const fs = require('fs')

const OpenApiMockGenerator = require('../../../src/lib/openApiMockGenerator')
const mockGenerator = new OpenApiMockGenerator()
const specFilePrefix = 'test/samples/'

const jsfRef = [
  {
    "id": "quoteId"
  },
  {
    "id": "id"
  },
  {
    "id": "state",
    "pattern": "Created|Closed"
  },
  {
    "id": "reason",
    "pattern": "Created|Closed"
  },
  
  {
    "id": "Content-Length",
    "pattern": "123"
  }
]


describe('OpenApiMockGenerator', () => {
  describe('load a async api file', () => {
    it('Load method should not throw error', async () => {
      await expect(mockGenerator.load(specFilePrefix + 'api_spec_async.yaml')).resolves.toBeUndefined()
    })
    it('generateRequestBody should generate a request body', async () => {
      const result = await mockGenerator.generateRequestBody( '/quotes', 'post', jsfRef)
      expect(result).toHaveProperty('quoteId')
    })
    it('generateRequestHeaders should generate a request headers', async () => {
      const result = await mockGenerator.generateRequestHeaders( '/quotes', 'post', jsfRef)
      expect(result).toHaveProperty('Accept')
      expect(result).toHaveProperty('Content-Type')
      expect(result).toHaveProperty('Date')
    })
    it('generateRequestHeaders should generate a request headers', async () => {
      const result = await mockGenerator.generateRequestHeaders( '/transfers', 'post')
    })
  })
  describe('load a sync api file', () => {
    it('Load method should not throw error', async () => {
      await expect(mockGenerator.load(specFilePrefix + 'api_spec_sync_empty.yaml')).resolves.toBeUndefined()
    })
    it('Load method should not throw error', async () => {
      await expect(mockGenerator.load(specFilePrefix + 'api_spec_sync.yaml')).resolves.toBeUndefined()
    })
    it('generateRequestBody should generate a request body', async () => {
      const result = await mockGenerator.generateRequestBody( '/settlements', 'post', jsfRef)
      expect(result).toHaveProperty('reason')
      expect(result).toHaveProperty('settlementWindows')
    })
    it('generateRequestBody should generate a request body', async () => {
      const result = await mockGenerator.generateRequestBody( '/settlements', 'post')
      expect(result).toHaveProperty('reason')
      expect(result).toHaveProperty('settlementWindows')
    })
    it('generateResponseBody should generate a request body', async () => {
      const result = await mockGenerator.generateResponseBody( '/settlements', 'get', jsfRef)
      expect(result).toHaveProperty('body')
      expect(result).toHaveProperty('status')
    })
    it('generateResponseBody should generate a request body', async () => {
      const result = await mockGenerator.generateResponseBody( '/settlements', 'get')
      expect(result).toHaveProperty('body')
      expect(result).toHaveProperty('status')
    })
    
    it('generateResponseBody should generate a request body if response type is array', async () => {
      const result = await mockGenerator.generateResponseBody( '/settlementWindows', 'get', jsfRef)
      expect(result).toStrictEqual({})
    })
    it('generateResponseBody should generate a request body if response type is object', async () => {
      const result = await mockGenerator.generateResponseBody( '/settlementWindows/{id}', 'get', jsfRef)
      expect(result.status).toBe('200')
    })
    it('generateRequestQueryParams should generate query params', async () => {
      const result = await mockGenerator.generateRequestQueryParams( '/settlementWindows', 'get')
      expect(result).toHaveProperty('fromDateTime')
      expect(result).toHaveProperty('participantId')
      expect(result).toHaveProperty('state')
    })
    it('generateRequestQueryParams should generate query params', async () => {
      const jsfRefNew  = [
        ...jsfRef,
        {
          "id": "participantId",
          "pattern": "123"
        }
      ]
      const result = await mockGenerator.generateRequestQueryParams( '/settlementWindows', 'get', jsfRef)
      console.log(result)
      expect(result).toHaveProperty('fromDateTime')
      expect(result).toHaveProperty('participantId')
      expect(result).toHaveProperty('state')
    })
    it('generateRequestQueryParams should generate query params', async () => {
      const result = await mockGenerator.generateRequestQueryParams( '/settlementWindows/{id}', 'get', jsfRef)
      expect(result).toEqual({})
    })
  })
})
