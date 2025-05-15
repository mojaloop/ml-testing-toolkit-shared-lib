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

const _ = require('lodash')
// const fs = require('fs')
// const jref = require('json-ref-lite')
// const yaml = require('js-yaml')
const { faker } = require('@faker-js/faker')
const JSONSchemaSampler = require('@stoplight/json-schema-sampler')
const $RefParser = require('json-schema-ref-parser')
const Ajv = require('ajv')

// Configure the sampler options to match original jsf behavior
const samplerOptions = {
  skipNonRequired: false, // equivalent to alwaysFakeOptionals: true
  quiet: true,
  maxSampleDepth: 5,
  maxItems: 2, // match original jsf option
  ignoreMissingRefs: true, // match original jsf option
  // Custom format handlers
  formatHandlers: {
    byte: () => Buffer.alloc(faker.lorem.sentence(12)).toString('base64')
  },
  // Custom type handlers for more realistic data
  typeHandlers: {
    string: (schema) => {
      if (schema.format === 'date-time') return faker.date.anytime().toISOString()
      if (schema.format === 'date') return faker.date.anytime().toISOString().split('T')[0]
      if (schema.format === 'email') return faker.internet.email()
      if (schema.format === 'uri') return faker.internet.url()
      if (schema.format === 'uuid') return faker.string.uuid()
      return faker.lorem.sentence()
    },
    number: () => faker.number.int(),
    integer: () => faker.number.int(),
    boolean: () => faker.datatype.boolean()
  }
}

const ajv = new Ajv({
  strict: false,
  formats: {
    reserved: true
  }
})

async function loadYamlFile (fn) {
  // let tree = yaml.safeLoad(fs.readFileSync(fn, 'utf8'))
  let tree = await $RefParser.parse(fn)

  // Add keys to schemas
  if (tree.components && tree.components.schemas) {
    Object.keys(tree.components.schemas).forEach(k => {
      tree.components.schemas[k].key = k
    })
  }

  // Add parameters to methods
  _.forEach(tree.paths, (o, routePath) => {
    const params = o.parameters || []
    _.forEach(o, (defn, httpMethod) => {
      if (httpMethod === 'parameters') {
        return
      }

      defn.parameters = params.concat(defn.parameters || [])
    })
  })

  // Resolve $refs
  // tree = jref.resolve(tree)
  tree = await $RefParser.dereference(tree)

  // Merge all "allOf"
  if (tree.components && tree.components.schemas) {
    Object.keys(tree.components.schemas).forEach(k => {
      const schema = tree.components.schemas[k]

      if (schema.properties) {
        Object.keys(schema.properties).forEach(k => {
          const prop = schema.properties[k]

          if (prop.allOf) {
            schema.properties[k] = Object.assign({}, ...prop.allOf)
          }
        })
      }
    })
  }

  // Validate all endpoint schemas
  if (tree.paths) {
    _.forEach(tree.paths, (methodMap, routePath) => {
      _.forEach(methodMap, (operation, method) => {
        if (method === 'parameters' || method.startsWith('x-')) {
          return
        }

        const reqSchema = findRequestSchema(operation.requestBody)
        if (reqSchema) {
          operation.validateRequest = ajv.compile(reqSchema)
        }
        const resSchema = findResponseSchema(operation.responses)
        if (resSchema) {
          operation.validateResponse = ajv.compile(resSchema)
        }
      })
    })
  }

  return tree
}

const findResponseSchema = (r) => {
  const successCode = _.find(r, (v, k) => k >= 200 && k <= 299)
  const content = successCode ? successCode.content : null
  if (content == null || Object.entries(content).length === 0) {
    return null
  }
  // Get first object by key.
  return _.find(content).schema
}

const findRequestSchema = (r) => {
  const { content } = r || {}
  if (content == null) {
    return null
  }
  return _.find(content).schema
}

const processRefs = (schema, jsfRefs) => {
  if (!jsfRefs || !jsfRefs.length) return schema

  const newSchema = JSON.parse(JSON.stringify(schema))

  // Process each reference
  jsfRefs.forEach(ref => {
    // Convert the reference ID to a valid JSON pointer path
    const path = ref.id.split('.').map(part => {
      // Escape special characters in JSON pointer
      return part.replace(/~/g, '~0').replace(/\//g, '~1')
    }).join('/')

    // Handle array items specially
    if (newSchema.type === 'array' && newSchema.items) {
      if (newSchema.items.properties) {
        const targetObject = _.get(newSchema.items.properties, path)
        if (targetObject) {
          // Instead of setting $ref, copy the schema properties
          Object.assign(targetObject, { type: 'string' }) // Default to string type
          if (ref.pattern) {
            delete targetObject.pattern
            delete targetObject.enum
          }
        }
      }
    } else if (newSchema.properties) {
      const targetObject = _.get(newSchema.properties, path)
      if (targetObject) {
        // Instead of setting $ref, copy the schema properties
        Object.assign(targetObject, { type: 'string' }) // Default to string type
        if (ref.pattern) {
          delete targetObject.pattern
          delete targetObject.enum
        }
      }
    }
  })

  return newSchema
}

const generateMockResponseBody = async (method, name, data, jsfRefs) => {
  const responseSchema = findResponseSchema(data.responses)
  if (!responseSchema) {
    return {}
  }

  const processedSchema = processRefs(responseSchema, jsfRefs)
  const fakedResponse = {}
  fakedResponse.body = JSONSchemaSampler.sample(processedSchema, samplerOptions)

  for (const key in data.responses) {
    fakedResponse.status = key
    if (key >= 200 && key <= 299) {
      break
    }
  }
  return fakedResponse
}

const generateMockOperation = async (method, name, data, jsfRefs) => {
  const requestSchema = findRequestSchema(data.requestBody)
  if (!requestSchema) {
    return {}
  }

  const processedSchema = processRefs(requestSchema, jsfRefs)
  return JSONSchemaSampler.sample(processedSchema, samplerOptions)
}

const generateMockHeaders = async (method, name, data, jsfRefs) => {
  const properties = {}
  data.parameters.forEach(param => {
    if (param.in === 'header') {
      properties[param.name] = (param.schema && param.schema.type) ? { type: param.schema.type } : {}
    }
  })

  if (Object.keys(properties).length === 0) {
    return {}
  }

  const schema = { type: 'object', properties }
  const processedSchema = processRefs(schema, jsfRefs)
  let fakedResponse = JSONSchemaSampler.sample(processedSchema, samplerOptions)
  if (fakedResponse === null) fakedResponse = {}
  return fakedResponse
}

const generateMockQueryParams = async (method, name, data, jsfRefs) => {
  const properties = {}
  data.parameters.forEach(param => {
    if (param.in === 'query') {
      properties[param.name] = (param.schema) ? { ...param.schema } : {}
    }
  })

  if (Object.keys(properties).length === 0) {
    return {}
  }

  const schema = { type: 'object', properties }
  const processedSchema = processRefs(schema, jsfRefs)
  let fakedResponse = JSONSchemaSampler.sample(processedSchema, samplerOptions)
  if (fakedResponse === null) fakedResponse = {}
  return fakedResponse
}

const generateMockPathParams = async (method, name, data, jsfRefs) => {
  const properties = {}
  data.parameters.forEach(param => {
    if (param.in === 'path') {
      properties[param.name] = (param.schema) ? { ...param.schema } : {}
    }
  })

  if (Object.keys(properties).length === 0) {
    return {}
  }

  const schema = { type: 'object', properties }
  const processedSchema = processRefs(schema, jsfRefs)
  let fakedResponse = JSONSchemaSampler.sample(processedSchema, samplerOptions)
  if (fakedResponse === null) fakedResponse = {}
  return fakedResponse
}

class OpenApiRequestGenerator {
  constructor () {
    this.schema = {}
  }

  async load (schemaPath) {
    this.schema = await loadYamlFile(schemaPath)
  }

  async generateRequestBody (path, httpMethod, jsfRefs = []) {
    const pathValue = this.schema.paths[path]
    const operation = pathValue[httpMethod]
    const id = operation.operationId || operation.summary
    return generateMockOperation(httpMethod, id, operation, jsfRefs)
  }

  async generateRequestHeaders (path, httpMethod, jsfRefs = []) {
    const pathValue = this.schema.paths[path]
    const operation = pathValue[httpMethod]
    const id = operation.operationId || operation.summary
    return generateMockHeaders(httpMethod, id, operation, jsfRefs)
  }

  async generateRequestQueryParams (path, httpMethod, jsfRefs = []) {
    const pathValue = this.schema.paths[path]
    const operation = pathValue[httpMethod]
    const id = operation.operationId || operation.summary
    return generateMockQueryParams(httpMethod, id, operation, jsfRefs)
  }

  async generateRequestPathParams (path, httpMethod, jsfRefs = []) {
    const pathValue = this.schema.paths[path]
    const operation = pathValue[httpMethod]
    const id = operation.operationId || operation.summary
    return generateMockPathParams(httpMethod, id, operation, jsfRefs)
  }

  async generateResponseBody (path, httpMethod, jsfRefs = []) {
    const pathValue = this.schema.paths[path]
    const operation = pathValue[httpMethod]
    const id = operation.operationId || operation.summary

    return generateMockResponseBody(httpMethod, id, operation, jsfRefs)
  }
}

module.exports = OpenApiRequestGenerator
