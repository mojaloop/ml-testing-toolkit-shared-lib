const { readFileAsync, readRecursiveAsync, fileStatAsync } = require('../utils')
const MASTERFILE_NAME = 'master.json'

// Sample comment
const getFileData = async (file_to_read, fileStat) => {
    try {
        const content = await readFileAsync(file_to_read)
        const fileContent = JSON.parse(content);
        return {
            name: file_to_read,
            path: file_to_read,
            size: fileStat.size,
            modified: '' + fileStat.mtime,
            content: fileContent
        }
    } catch (err) {
        console.log(err.message)
        return null
    }
}
const getFolderRawData = async (folderList) => {
    var importFolderRawData = []

    for (var i = 0; i < folderList.length; i++) {
        const fileItem = folderList[i]
        const stat = await fileStatAsync(fileItem)
        if (stat.isFile() && fileItem.endsWith('.json')) {
            const fileItemData = await getFileData(fileItem, stat)
            if (fileItemData) {
                importFolderRawData.push(fileItemData)
            }
        } else if (stat.isDirectory()){
            const fileList = await readRecursiveAsync(fileItem)
            for (var j = 0; j < fileList.length; j++) {
                const fileItemData = await getFileData(fileList[j], stat)
                if (fileItemData) {
                    importFolderRawData.push(fileItemData)
                }
            }
        }
    }
    importFolderRawData.sort((a, b) => a.path.localeCompare(b.path))
    return importFolderRawData
}


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
            extraInfo = extraInfo ? extraInfo : { type: 'folder' }
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

const getFolderData = async (fileList) => {
    const importFolderRawData = await getFolderRawData(fileList)
    return convertToFolderNestedArray(importFolderRawData)
}

getContentFromAbsolutePath = (path, folderData) => {
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
    const findNode = children.find(item => (item.title === pathArray[pathArray.length - 1]))
    if (findNode) {
      return findNode.content
    }
    return null
  }
  getAbsolutePathOfRelativeFileRef = (refNode) => {
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

  const addChildrenToTestCases = (folderData, nodeChildren, testCases, startIndex) => {
    var newTestCases = testCases
    for (let i=0; i<nodeChildren.length; i++) {
      if (nodeChildren[i].isLeaf) {
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
          message.error({ content: err.message, key: 'importFileProgress', duration: 2 });
          break;
        }
      } else {
        if (nodeChildren[i].children) {
          // console.log('The node has children', nodeChildren[i].children, newTestCases)
          newTestCases = addChildrenToTestCases(folderData, nodeChildren[i].children, newTestCases, startIndex)
        }
      }
    }
    return newTestCases
  }

  const getTempate = (folderData) => {
    var template = {}
    var testCases = []
    testCases = addChildrenToTestCases(folderData, folderData, testCases, 0)
    template.test_cases = testCases
    template.name = 'multi'
    return template
  }

module.exports = {
    getTempate,
    getFolderData
} 