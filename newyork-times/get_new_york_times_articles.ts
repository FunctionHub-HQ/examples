import axios from 'npm:axios';
import HTMLParser, { HTMLElement } from 'npm:node-html-parser';

export interface Article {
  title: string,
  author: string,
  date: string,
  summary: string,
  url: string
}

export interface Request {
  /**
   * The person being greeted
   */
  url: string,

  /** Number of articles to fetch */
  numArticles: number
}

export interface Response {
  /**
   * New York Times articles
   */
  articles?: Article[]
}

function setupAxios() {
  axios.defaults.headers.common['X-Function-Hub-Access-Token'] =
      Hub.env.FH_ACCESS_TOKEN
}

function parseDate(path: string): string {
  const parts = path?.split("/").filter(it => !!it)
  let date = ""
  if (parts) {
    date = `${parts[1]}/${parts[2]}/${parts[0]}`
  }
  console.log(date)
  return date
}

function parseHtml(html: string, numArticles: number): Article[] {
  const limit = 10 || numArticles
  const result: Article[] = []
  const baseUrl = "https://www.nytimes.com"
  const root = HTMLParser.parse(html);
  const panel = root.querySelector('#stream-panel')
  const articles: HTMLElement[] | undefined = panel?.getElementsByTagName("ol")[0].getElementsByTagName("li")
  if (articles) {
    for (let i = 0; i < limit; i++) {
      const articleElement = articles[i].getElementsByTagName("article")[0]
      const aTag = articleElement.getElementsByTagName("a")[0]
      const path = aTag.getAttribute("href")
      const url = baseUrl + path
      const title = aTag.innerText
      const summary = articleElement.getElementsByTagName("p")[0].innerText
      const spans = articles[i].getElementsByTagName("span")
      const author = spans[0].innerText
      const date = parseDate(path)
      result.push({
        date,
        author,
        summary,
        title,
        url: url
      })
    }
  }
  return result
}

/**
 * @name get_new_york_times_articles
 * @summary Gets today's New York Times articles
 * @description Gets today's New York Times articles.
 */
export async function handler(request: Request): Promise<Response> {
  setupAxios()
  let articles: Article[] = []
  let errors = null
  try {
    const response =  await axios.get(request.url)
    articles = parseHtml(response.data, request.numArticles)
  } catch (error) {
    errors = error.response?.data
  }
  return {
    articles,
    errors
  }
}