import ts from 'typescript'
import fs from 'fs'

const map = {
    'StringKeyword': 'string',
    'NumberKeyword': 'number',
    'BooleanKeyword': 'boolean',
    'NullKeyword': 'null',
    'UndefinedKeyword': 'undefined',
    'SymbolKeyword': 'symbol',
    'AnyKeyword': 'any',
    'UnionType': 'union',
    'FunctionType': 'function',
    'IntersectionType': 'intersection',
    'VoidKeyword': 'void',
}

function getType(kind) {
    return map[ts.SyntaxKind[kind]]
}
function getTsType(kind) {
    return ts.SyntaxKind[kind]
}
interface RD {
    [key: string]: {
        name: string
        type: string,
        sourceType: any
        description: string
        defaultValue: string
        OptionalValue: string
    }[]
}

function getNode(filePath: string) {
    const data: RD = {}
    const node = ts.createSourceFile(
        'x.ts',   // fileName
        fs.readFileSync(filePath, { encoding: 'utf-8'}), // sourceText
        ts.ScriptTarget.Latest
    );
    node.forEachChild(child => {
        // 处理导入 需要再次解析导入的数据
        if (ts.SyntaxKind[child.kind] === 'ImportDeclaration') {

        }
        // 处理 interface 导出的才进行处理
        if (ts.SyntaxKind[child.kind] === 'InterfaceDeclaration'
            && getTsType(child.modifiers?.[0].kind) === 'ExportKeyword' ) {
            data[child.name.escapedText] = []
            child.members.forEach(member => {
                const { jsDoc } = member
                let description = ''
                let comments = {}
                let sourceType: any = {}
                if (jsDoc) {
                    // 用户只写了一行Jsdoc注释 默认认为是描述
                    if (jsDoc.comment) {
                        description = jsDoc.comment
                    } else {
                        jsDoc.forEach((doc) => {
                            const { tags } = doc
                            if (tags) {
                                tags.forEach(tag => {
                                    comments[tag.tagName.escapedText] = tag.comment
                                })
                            } else {
                                comments['description'] = doc.comment
                            }
                        })
                    }
                }
                let type = map[ts.SyntaxKind[member.type.kind]]
                sourceType.type = type
                if (type === 'union') {
                    sourceType['types'] = member.type.types.map(item => {
                        return map[ts.SyntaxKind[item.kind]] || item.literal?.text
                    })
                    type = sourceType['types'].join(' | ')
                }
                if (type === 'function') {
                    sourceType['parameters'] = []
                    member.type.parameters.forEach((item) => {
                        sourceType['parameters'].push([item.name.escapedText, getType(item.type.kind)])
                    })
                    sourceType['returnType'] = getType(member.type.type.kind)
                    type = `(${sourceType['parameters'].map(item => item.join(':')).join(', ')}) => ${sourceType['returnType']}`
                }

                data[child.name.escapedText].push({
                    name: member.name.escapedText,
                    type: type,
                    sourceType,
                    description: description || comments['description'],
                    defaultValue: comments['default'],
                    OptionalValue: comments['optional'],
                })
            })
        }

    })

    return data
}


export function parseInterface(filePath: string) {
    return getNode(filePath)
}
