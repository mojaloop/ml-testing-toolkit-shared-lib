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
const customTracePrefix = 'aabb'

const randHex = (len) => {
  const maxlen = 8
  const min = Math.pow(16, Math.min(len, maxlen) - 1)
  const max = Math.pow(16, Math.min(len, maxlen)) - 1
  const n = Math.floor(Math.random() * (max - min + 1)) + min
  let r = n.toString(16)
  while (r.length < len) {
    r = r + randHex(len - maxlen)
  }
  return r
}

const isCustomTraceID = (traceID) => {
  return traceID.startsWith(customTracePrefix)
}

const getEndToEndID = (traceID) => {
  return traceID.slice(-4)
}

const getSessionID = (traceID) => {
  return traceID.slice(4, -4)
}

const getTraceIdPrefix = () => {
  return customTracePrefix
}

const generateRandTraceId = () => {
  return 'ccdd' + randHex(26)
}

const getTraceParentHeader = (traceID) => {
  return '00-' + traceID + '-0123456789abcdef0-00'
}

const generateSessionId = () => {
  // Create a session ID (24 hex chars)
  return randHex(24)
}

const generateEndToEndId = () => {
  // Create a end to end transaction ID (4 hex chars)
  return randHex(4)
}

module.exports = {
  isCustomTraceID,
  getEndToEndID,
  getSessionID,
  getTraceIdPrefix,
  generateRandTraceId,
  getTraceParentHeader,
  generateSessionId,
  generateEndToEndId
}
