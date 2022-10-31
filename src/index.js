import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import spawn from 'cross-spawn'
import minimist from 'minimist'
import prompts from 'prompts'
import {
  bgLightBlue,
  blue,
  cyan,
  green,
  bgLightGreen,
  lightRed,
  magenta,
  red,
  reset,
  yellow,
} from 'kolorist'

const argv = minimist(process.argv.slice(2), { string: ['_'] })
// 当前路径
const cwd = process.cwd()

// type ColorFunc = (str | number) => string
// interface Framework {
//   name
//   display
//   color: ColorFunc
//   variants: FrameworkVariant[]
// }
// interface FrameworkVariant {
//   name
//   display
//   color: ColorFunc
//   customCommand?
// }

const FRAMEWORKS = [
  {
    name: 'react-component-library',
    display: 'react-component-library React组件库',
    color: bgLightBlue,
  },
  {
    name: 'vue-component-library',
    display: 'vue-component-library Vue组件库',
    color: bgLightGreen,
  },
]

const TEMPLATES = FRAMEWORKS.map(f => f.name)

const renameFiles = {
  _gitignore: '.gitignore',
}

const defaultTargetDir = 'dino-project'

async function init() {
  const argTargetDir = formatTargetDir(argv._[0])
  //  选择模板
  const argTemplate = argv.template || argv.t
  //  文件名
  let targetDir = argTargetDir || defaultTargetDir
  // 允许直接在新建的文件夹下拉取项目
  const getProjectName = () => targetDir === '.' ? path.basename(path.resolve()) : targetDir

  let result

  try {
    result = await prompts(
      [
        {
          type: argTargetDir ? null : 'text',
          name: 'projectName',
          message: reset('project name:'),
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir
          },
        },
        {
          // 判断文件夹是否不为空
          type: () => !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm',
          name: 'overwrite',
          message: () =>
            `${targetDir === '.'
              ? 'Current directory'
              : `Target directory "${targetDir}"`
            } is not empty. Remove existing files and continue?`,
        },
        {
          // 文件不为空时 选择不清除的话退出程序
          type: (_, { overwrite }) => {
            if (overwrite === false) {
              throw new Error(`${red('✖')} Operation cancelled`)
            }
            return null
          },
          name: 'overwriteChecker',
        },
        {
          // 检验包名是否合法
          type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
          name: 'packageName',
          message: reset('Package name:'),
          // 不合法的话 合法化
          initial: () => toValidPackageName(getProjectName()),
          validate: dir => isValidPackageName(dir) || 'Invalid package.json name',
        },
        {
          // 开始选取模板
          type: argTemplate && TEMPLATES.includes(argTemplate) ? null : 'select',
          name: 'framework',
          message:
            typeof argTemplate === 'string' && !TEMPLATES.includes(argTemplate)
              ? reset(`"${argTemplate}" isn't a valid template. Please choose from below: `)
              : reset('Select a framework:'),
          initial: 0,
          choices: FRAMEWORKS.map((framework) => {
            const frameworkColor = framework.color
            return {
              title: frameworkColor(framework.display || framework.name),
              value: framework.name,
            }
          }),
        },
        {
          // 如果还有下一层
          type: framework => framework && framework.variants ? 'select' : null,
          name: 'variant',
          message: reset('Select a variant:'),
          choices: framework =>
            framework.variants.map((variant) => {
              const variantColor = variant.color
              return {
                title: variantColor(variant.display || variant.name),
                value: variant.name,
              }
            }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(`${red('✖')} 你取消了操作 --> Operation cancelled `)
        },
      },
    )
  }
  catch (cancelled) {
    console.log(cancelled.message)
    return
  }

  // user choice associated with prompts
  const { framework, overwrite, packageName, variant } = result

  const root = path.join(cwd, targetDir)
  if (overwrite) {
    // 文件夹清空
    emptyDir(root)
  }
  else if (!fs.existsSync(root)) {
    // 创建文件夹
    fs.mkdirSync(root, { recursive: true })
  }

  // determine template
  const template = variant || framework || argTemplate

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
  const pkgManager = pkgInfo ? pkgInfo.name : 'pnpm'
  const isYarn1 = pkgManager === 'yarn' && pkgInfo?.version.startsWith('1.')

  // // 自定义指令
  // const { customCommand } = (FRAMEWORKS.flatMap(f => f.variants) || []).find(v => v.name === template) ?? {}

  // if (customCommand) {
  //   const fullCustomCommand = customCommand
  //     .replace('TARGET_DIR', targetDir)
  //     .replace(/^npm create/, `${pkgManager} create`)
  //     // Only Yarn 1.x doesn't support `@version` in the `create` command
  //     .replace('@latest', () => (isYarn1 ? '' : '@latest'))
  //     .replace(/^npm exec/, () => {
  //       // Prefer `pnpm dlx` or `yarn dlx`
  //       if (pkgManager === 'pnpm') {
  //         return 'pnpm dlx'
  //       }
  //       if (pkgManager === 'yarn' && !isYarn1) {
  //         return 'yarn dlx'
  //       }
  //       // Use `npm exec` in all other cases,
  //       // including Yarn 1.x and other custom npm clients.
  //       return 'npm exec'
  //     })

  //   const [command, ...args] = fullCustomCommand.split(' ')
  //   const { status } = spawn.sync(command, args, {
  //     stdio: 'inherit',
  //   })
  //   process.exit(status ?? 0)
  // }

  console.log(`\n🦖 Scaffolding project in ${root}...`)
  console.log('🦖 选择模板:', template)
  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../..',
    `template/${template}`,
  )

  const write = (file, content) => {
    const targetPath = path.join(root, renameFiles[file] ?? file)
    if (content) {
      fs.writeFileSync(targetPath, content)
    }
    else {
      copy(path.join(templateDir, file), targetPath)
    }
  }

  const files = fs.readdirSync(templateDir)

  for (const file of files.filter(f => f !== 'package.json')) {
    write(file)
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, 'package.json'), 'utf-8'),
  )

  pkg.name = packageName || getProjectName()

  write('package.json', JSON.stringify(pkg, null, 2))

  console.log('\nDone. Now run:\n')
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`)
  }
  switch (pkgManager) {
    case 'yarn':
      console.log('  yarn')
      console.log('  yarn dev')
      break
    default:
      console.log(`  ${pkgManager} install`)
      console.log(`  ${pkgManager} run dev`)
      break
  }
  console.log()
}

function formatTargetDir(targetDir) {
  return targetDir?.trim().replace(/\/+$/g, '')
}

function copy(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  }
  else {
    fs.copyFileSync(src, dest)
  }
}

function isValidPackageName(projectName) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName,
  )
}

function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function isEmpty(path) {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

function emptyDir(dir) {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

function pkgFromUserAgent(userAgent) {
  if (!userAgent) { return undefined }
  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  }
}

init().catch((e) => {
  console.error(e)
})
