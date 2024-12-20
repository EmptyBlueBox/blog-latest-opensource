import type {
  Blockquote,
  FootnoteDefinition,
  Html,
  Link,
  ListItem,
  Node,
  Paragraph,
  Root
} from 'mdast'
import getReadingTime from 'reading-time'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

import { fetchArxivApi, fetchGitHubApi } from '../utils/api'
import toString from './mdastUtilToString'

export const remarkReadingTime: Plugin<[], Root> = function () {
  return function (tree, { data }) {
    const textOnPage = toString(tree)
    const readingTime = getReadingTime(textOnPage)
    // readingTime.text will give us minutes read as a friendly string,
    // i.e. "3 min read"
    const astroData = data as { astro: { frontmatter: { minutesRead: string } } }
    astroData.astro.frontmatter.minutesRead = readingTime.text
  }
}

export const remarkAddZoomable: Plugin<[string], Root> = function (className = 'zoomable') {
  return function (tree) {
    visit(tree, 'image', (node: Node) => {
      node.data = { hProperties: { class: className } }
    })
  }
}

const initGitHubCard = async (
  node: Paragraph,
  index?: number,
  parent?: Root | Blockquote | FootnoteDefinition | ListItem
) => {
  if (
    node.type === 'paragraph' &&
    node.children.length === 1 &&
    node.children[0].type === 'link' &&
    index &&
    parent &&
    parent.type === 'root'
  ) {
    const link = node.children[0] as Link
    const match = link.url.match(/https:\/\/github\.com\/([^\/]+)\/([^\/]+)/)

    if (match) {
      const [, owner, repo] = match
      try {
        const data = await fetchGitHubApi(`https://api.github.com/repos/${owner}/${repo}`)
        // sleep 1 second to avoid rate limit
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const languagePart = data.language
          ? `<span class="flex items-center text-gray-700 dark:text-gray-400">
              <span class="mr-2 inline-block h-3 w-3 rounded-full bg-gray-700 dark:bg-slate-100"
              ></span>
              ${data.language}
            </span>`
          : ''

        const newNode: Html = {
          type: 'html',
          value: `
  <a href="${data.html_url}" target="_blank" class="not-prose block my-4">
            <div
    class="github-card bg-gray-100 dark:bg-gray-900 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-center items-center [&_*]:!no-underline"
  >
    <img
      src="${data.owner.avatar_url}"
      alt="avatar"
      class="w-12 h-12 rounded-full mb-4 sm:mb-0 sm:!mr-4 mt-0"
    />
    <div class="flex-grow">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h3
          class="text-gray-900 dark:text-white font-bold text-center sm:text-left mt-0 mb-1 text-lg"
        >
          ${data.name}
        </h3>
        <div class="flex items-center mt-2 sm:mt-0 mx-auto sm:mx-0 gap-4">
          <span class="text-yellow-500 flex items-center">
            <svg class="w-4 h-4 mr-1">
              <use href="/icons/ui.svg#mingcute-star-line"></use>
            </svg>
            ${data.stargazers_count}
          </span>
          ${languagePart}
        </div>
      </div>
      <p class="text-gray-700 dark:text-gray-400 text-sm mt-2">
         ${data.description}
      </p>
    </div>
</div>
  </a>
          `
        }

        parent.children[index] = newNode
      } catch (err) {
        console.error('Error fetching GitHub data:', err)
      }
    }
  }
}

export function remarkGithubCards() {
  return async function transformer(tree: Root) {
    const promises: any = []
    visit(tree, 'paragraph', (node, index, parent) => {
      promises.push(initGitHubCard(node, index, parent))
    })
    await Promise.all(promises)
    return tree
  }
}

const initArxivCard = async (
  node: Paragraph,
  index?: number,
  parent?: Root | Blockquote | FootnoteDefinition | ListItem
) => {
  if (
    node.type === 'paragraph' &&
    node.children.length === 1 &&
    node.children[0].type === 'link' &&
    index &&
    parent &&
    parent.type === 'root'
  ) {
    const link = node.children[0] as Link
    const match = link.url.match(/https:\/\/arxiv\.org\/(abs|pdf)\/(\d{4}\.\d+(?:v\d+)?)/)

    if (match) {
      const [, , id] = match
      try {
        const data = await fetchArxivApi(id)

        const newNode: Html = {
          type: 'html',
          value: `
  <a href="${data.url}" target="_blank" class="not-prose block my-4">
            <div
    class="arxiv-card bg-gray-100 dark:bg-gray-900 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-center items-center [&_*]:!no-underline"
  >
    <div class="flex-grow">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h3
          class="text-gray-900 dark:text-white font-bold text-center sm:text-left mt-0 mb-1 text-lg"
        >
          ${data.title}
        </h3>
        <div class="flex items-center mt-2 sm:mt-0 mx-auto sm:mx-0">
          <span class="text-yellow-500 flex items-center">
            <svg class="w-4 h-4 mr-1">
              <use href="/icons/ui.svg#mingcute-paper-line"></use>
            </svg>
            ${data.id}
          </span>
        </div>
      </div>
      <p class="text-gray-700 dark:text-gray-400 text-sm mt-2">
         ${data.authors}
      </p>
    </div>
</div>
  </a>
          `
        }

        parent.children[index] = newNode
      } catch (err) {
        console.error('Error fetching Arxiv data:', err)
      }
    }
  }
}

// 创建处理Markdown中Arxiv链接的插件
export function remarkArxivCards() {
  return async function transformer(tree: Root) {
    const promises: any[] = []
    visit(tree, 'paragraph', (node, index, parent) => {
      promises.push(initArxivCard(node, index, parent))
    })
    await Promise.all(promises)
    return tree
  }
}
