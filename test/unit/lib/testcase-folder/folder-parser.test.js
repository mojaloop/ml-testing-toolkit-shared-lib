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
 * Vijaya Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/

'use strict'

const FolderParser = require('../../../../src/lib/testcase-folder/folder-parser')

const sampleTestCase = {
  id: 1,
  name: 'Test Case Name',
  requests: []
}

const sampleFolderRawData = [
  {
    name: 'name1',
    path: 'path1',
    size: 123,
    modified: 'modified1',
    content: { name: 'template1', test_cases: [ sampleTestCase ] }
  },
  {
    name: 'name2',
    path: 'path2',
    size: 123,
    modified: 'modified2',
    content: { name: 'template2', test_cases: [ sampleTestCase ] }
  },
  {
    name: 'name3',
    path: 'path3/name3',
    size: 123,
    modified: 'modified3',
    content: { name: 'template3', test_cases: [ sampleTestCase ] }
  },
  {
    name: 'name4',
    path: 'path3/name4',
    size: 123,
    modified: 'modified4',
    content: { name: 'template4', test_cases: [ sampleTestCase ] }
  },
  {
    name: 'master.json',
    path: 'path3/master.json',
    size: 123,
    modified: 'modified4',
    content: {
      order: [
        {
          name: 'name4',
          type: 'file'
        },
        {
          name: 'name3',
          type: 'file'
        },
        {
          name: 'name1',
          type: 'fileRef',
          path: '../name1'
        }
      ]
    }
  },
]

describe('FolderParser', () => {
  describe('getFolderData', () => {
    it('FolderParser should export getFolderData', async () => {
      expect(FolderParser).toHaveProperty('getFolderData')
    })
    it('getFolderData should return proper folder data', async () => {
      const folderData = FolderParser.getFolderData(sampleFolderRawData)
      expect(Array.isArray(folderData)).toBe(true)
      expect(folderData.length).toEqual(3)
      // Validate the first node
      expect(folderData[0].key).toEqual('path1')
      expect(folderData[0].title).toEqual('path1')
      expect(folderData[0].isLeaf).toBeTruthy()
      expect(folderData[0].extraInfo).toHaveProperty('type')
      expect(folderData[0].extraInfo.type).toEqual('file')
      expect(folderData[0].content).toHaveProperty('name')
      expect(folderData[0].content.name).toEqual('template1')

      // Validate the second node
      expect(folderData[1].key).toEqual('path2')
      expect(folderData[1].title).toEqual('path2')
      expect(folderData[1].isLeaf).toBeTruthy()
      expect(folderData[1].extraInfo).toHaveProperty('type')
      expect(folderData[1].extraInfo.type).toEqual('file')
      expect(folderData[1].content).toHaveProperty('name')
      expect(folderData[1].content.name).toEqual('template2')

      // Validate the third node
      expect(folderData[2].key).toEqual('path3')
      expect(folderData[2].title).toEqual('path3')
      expect(folderData[2].isLeaf).not.toBeTruthy()
      expect(folderData[2].extraInfo).toHaveProperty('type')
      expect(folderData[2].extraInfo.type).toEqual('folder')
      expect(folderData[2]).toHaveProperty('children')
      expect(Array.isArray(folderData[2].children)).toBe(true)
      expect(folderData[2].children.length).toEqual(3)

      // Validate the child nodes, here the order should be according to master.json file. So name4 comes first.
      const child1 = folderData[2].children[0]
      // Validate the third node child 1
      expect(child1.key).toEqual('path3/name4')
      expect(child1.title).toEqual('name4')
      expect(child1.isLeaf).toBeTruthy()
      expect(child1.extraInfo).toHaveProperty('type')
      expect(child1.extraInfo.type).toEqual('file')
      expect(child1.content).toHaveProperty('name')
      expect(child1.content.name).toEqual('template4')

      const child2 = folderData[2].children[1]
      // Validate the third node child 2
      expect(child2.key).toEqual('path3/name3')
      expect(child2.title).toEqual('name3')
      expect(child2.isLeaf).toBeTruthy()
      expect(child2.extraInfo).toHaveProperty('type')
      expect(child2.extraInfo.type).toEqual('file')
      expect(child2.content).toHaveProperty('name')
      expect(child2.content.name).toEqual('template3')

      const child3 = folderData[2].children[2]
      // Validate the third node child 3
      expect(child3.key).toEqual('path3/name1')
      expect(child3.title).toEqual('name1')
      expect(child3.isLeaf).toBeTruthy()
      expect(child3.extraInfo).toHaveProperty('type')
      expect(child3.extraInfo.type).toEqual('fileRef')
    })
  })

  describe('getTestCases', () => {
    it('FolderParser should export getTestCases', async () => {
      expect(FolderParser).toHaveProperty('getTestCases')
    })
    it('getTestCases should return proper test cases', async () => {
      // First get the folderData
      const folderData = FolderParser.getFolderData(sampleFolderRawData)
      const testCases = FolderParser.getTestCases(folderData)
      expect(Array.isArray(testCases)).toBe(true)
      expect(testCases.length).toEqual(4)
      // Validate the first test case
      expect(testCases[0]).toHaveProperty('id')
      expect(testCases[0].id).toEqual(1)
      expect(testCases[0]).toHaveProperty('name')
      expect(testCases[0].name).toEqual('Test Case Name')

      // Validate the second test case
      expect(testCases[1]).toHaveProperty('id')
      expect(testCases[1].id).toEqual(2)
      expect(testCases[1]).toHaveProperty('name')
      expect(testCases[1].name).toEqual('Test Case Name')
    })
  })

  describe('sequenceTestCases', () => {
    it('FolderParser should export sequenceTestCases', async () => {
      expect(FolderParser).toHaveProperty('sequenceTestCases')
    })
    it('sequenceTestCases should return the same number of test cases', async () => {
      // First get the folderData
      const folderData = FolderParser.getFolderData(sampleFolderRawData)
      // Get the test cases
      const testCases = FolderParser.getTestCases(folderData)
      // Sequence them
      FolderParser.sequenceTestCases(testCases)
      // Validate the modified test cases
      expect(Array.isArray(testCases)).toBe(true)
      expect(testCases.length).toEqual(4)
    })
  })
})
