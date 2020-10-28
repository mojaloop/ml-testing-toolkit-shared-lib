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

const MASTERFILE_NAME = 'master.json'

const convertToFolderNestedArray = (folderRawData) => {
  // Form the object tree based from the array of paths
  var fileTree = {};
  const mergePathsIntoFileTree = (fileItem) => {
  return (prevDir, currDir, i, filePath) => {
      if (i === filePath.length - 1) {
      prevDir[currDir] = { type: 'file', content: fileItem.content };
      }
      if (!prevDir.hasOwnProperty(currDir)) {
      prevDir[currDir] = {};
      }
      return prevDir[currDir];
  }
  }
  function parseFileItem(fileItem) {
  var fileLocation = fileItem.path.split('/');
  // If file is in root directory, eg 'index.js'
  if (fileLocation.length === 1) {
      return (fileTree[fileLocation[0]] = { type: 'file', content: fileItem.content });
  }
  fileLocation.reduce(mergePathsIntoFileTree(fileItem), fileTree);
  }
  folderRawData.forEach(parseFileItem);


  // Form the array from the object fileTree
  const processFileOrFolder = (inputItem, inputArray, prefix = '') => {
    const actionFileOrFolder = (fileOrFolderItem, extraInfo = null) => {
        if (inputItem[fileOrFolderItem]) {
        if(inputItem[fileOrFolderItem].type === 'file') {
            extraInfo = extraInfo ? extraInfo : { type: 'file' }
            inputArray.push({ key: (prefix ? (prefix + '/') : '') + fileOrFolderItem, title: fileOrFolderItem, isLeaf: true, extraInfo, content: inputItem[fileOrFolderItem].content })
        } else {
            var children = []
            processFileOrFolder(inputItem[fileOrFolderItem], children, (prefix ? (prefix + '/') : '') + fileOrFolderItem)
            extraInfo = extraInfo || { type: 'folder' }
            inputArray.push({ key: (prefix ? (prefix + '/') : '') + fileOrFolderItem, title: fileOrFolderItem, extraInfo, children: children })
        }
        }
    }
    const actionFileRef = (name, refPath) => {
        const extraInfo = {
        type: 'fileRef',
        path: refPath
        }
        inputArray.push({ key: (prefix ? (prefix + '/') : '') + name, title: name, extraInfo, isLeaf: true})
    }
    // If master.json file exists in inputItem
    if (inputItem.hasOwnProperty(MASTERFILE_NAME)) {
        inputItem[MASTERFILE_NAME].content.order.forEach(orderItem => {
          if(orderItem.type === 'file' || orderItem.type === 'folder') {
              actionFileOrFolder(orderItem.name, { type: orderItem.type })
          } else if(orderItem.type === 'fileRef') {
              actionFileRef(orderItem.name, orderItem.path)
          }
        })
    } else {
        for (const fileOrFolderItem in inputItem) {
          actionFileOrFolder(fileOrFolderItem)
        }
    }
  }
  const treeDataArray = []
  processFileOrFolder(fileTree, treeDataArray)
  return treeDataArray
}

const getFolderData = (importFolderRawData) => {
  return convertToFolderNestedArray(importFolderRawData)
}

const findNodeFromAbsolutePath = (path, folderData) => {
  // Get the content of the corresponding node based on the absolute path from this.state.folderData
  const pathArray = path.split('/')
  let children = folderData
  for (let i=0; i<pathArray.length - 1; i++) {
    // Check if the key exists in the children
    const findNode = children.find(item => (item.title === pathArray[i]))
    if (findNode) {
      children = findNode.children
    } else {
      return null
    }
  }
  return children.find(item => (item.title === pathArray[pathArray.length - 1]))
}

const getContentFromAbsolutePath = (path, folderData) => {
  const findNode = findNodeFromAbsolutePath(path, folderData)
  if (findNode) {
    return findNode.content
  }
  return null
}

const getAbsolutePathOfRelativeFileRef = (refNode) => {
  // Calculate the absolute path based on the relative path
  const basePathArray = refNode.key.split('/')
  const refPathArray = refNode.extraInfo.path.split('/')
  let absolutePath = ''
  if (refPathArray[0] == '.') {
    absolutePath = basePathArray.slice(0, -1).join('/') + '/' + refPathArray.slice(1).join('/')
  } else if (refPathArray[0] == '..') {
    // Count the double dots
    let doubleDotCount
    for (doubleDotCount=0; doubleDotCount<refPathArray.length; doubleDotCount++) {
      if (refPathArray[doubleDotCount] != '..') {
        break
      }
    }
    // Check if we can not get the base path based on the double dots in relative path
    if ((basePathArray.length - 1) < doubleDotCount) {
      return null
    }
    const newBasePath = basePathArray.slice(0, -1-doubleDotCount).join('/')
    absolutePath = (newBasePath? (newBasePath + '/') : '') + refPathArray.slice(doubleDotCount).join('/')

  } else {
    absolutePath = basePathArray.slice(0, -1).join('/') + '/' + refPathArray.join('/')
  }

  return absolutePath
} 

const addChildrenToTestCases = (folderData, nodeChildren, testCases, selectedFiles, startIndex) => {
  var newTestCases = testCases
  for (let i=0; i<nodeChildren.length; i++) {
    if (nodeChildren[i].isLeaf) {
      if (selectedFiles && !selectedFiles.includes(nodeChildren[i].key)) {
        continue
      }
      let templateContent = {}
      if (nodeChildren[i].extraInfo && nodeChildren[i].extraInfo.type === 'fileRef') {
        // Get the content using relative path
        const absolutePath = getAbsolutePathOfRelativeFileRef(nodeChildren[i])
        if (absolutePath) {
          const content = getContentFromAbsolutePath(absolutePath, folderData)
          if (content) {
            templateContent = getContentFromAbsolutePath(absolutePath, folderData)
          }
        }
      } else {
        templateContent = nodeChildren[i].content;
      }
      try {
        templateContent.test_cases = templateContent.test_cases.map((testCase, index) => {
          const { id, ...remainingProps } = testCase
          return {
            id: startIndex + index + 1,
            ...remainingProps
          }
        })
        startIndex = startIndex + templateContent.test_cases.length
        newTestCases = newTestCases.concat(templateContent.test_cases)
      } catch(err) {
        console.log(err.message)
        break;
      }
    } else {
      if (nodeChildren[i].children) {
        // console.log('The node has children', nodeChildren[i].children, newTestCases)
        newTestCases = addChildrenToTestCases(folderData, nodeChildren[i].children, newTestCases, selectedFiles, startIndex)
      }
    }
  }
  return newTestCases
}

const getTestCases = (folderData, selectedFiles = null) => {
  var testCases = []
  testCases = addChildrenToTestCases(folderData, folderData, testCases, selectedFiles, 0)
  return testCases
}

const sequenceTestCases = (testCases) => {
  for (let i=0; i < testCases.length; i++) {
    testCases[i].id = i + 1
  }
}

module.exports = {
    getTestCases,
    getFolderData,
    sequenceTestCases,
    findNodeFromAbsolutePath
}
