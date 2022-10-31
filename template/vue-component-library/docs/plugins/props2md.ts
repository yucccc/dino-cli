// 将ts转换为table

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { parseInterface } from './parseInterface'

const reg = /(?<=ts2table[ ]).+(?=\s?)/
const replaceReg = /ts2table[ ].+(?=\s?)/

interface OP {
  /**
   * @default zh
   */
  language: 'zh' | 'en'
}
const header = ['参数', '说明', '类型', '可选值', '默认值']
function genTHeader() {
  return `<thead>
                <tr>
                    ${header.map(item => `<th style="white-space: nowrap">${item}</th>`).join('')}
                </tr>
            </thead>`
}
function genTBody(members) {
  return members.map((item) => {
    return `<tr>
            <td style="white-space: nowrap">${item.name}</td>
            <td style="white-space: nowrap">${item.description}</td>
            <td style="white-space: nowrap">${item.type}</td><td>${item.OptionalValue}</td>
            <td style="white-space: nowrap">${item.defaultValue}</td>
           </tr>`
  }).join('')
}
function genTFooter() {}

function genTable(title, item) {
  return `<h2>${title}</h2>
            <table>
            ${genTHeader()}
            ${genTBody(item)}
           </table>`
}
export function props2table(): Plugin {
  return {
    enforce: 'pre',
    name: 'props2table',

    transform(code, id) {
      if (id.endsWith('.md')) {
        const match = reg.exec(code)
        if (match && match[0]) {
          const p = resolve(fileURLToPath(import.meta.url), '../../', match[0].trim())
          const data = parseInterface(p)
          const table = Object.keys(data).map(title => genTable(title, data[title])).join('')
          return {
            code: code.replace(replaceReg, table),
          }
        }
      }
    },
  }
}

