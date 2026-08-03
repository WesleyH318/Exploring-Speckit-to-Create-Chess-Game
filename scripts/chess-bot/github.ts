// Minimal GitHub REST client.
//
// Deliberately dependency-free: Node 20+ ships fetch, and the bot only needs
// three endpoints, so pulling in an SDK would cost more than it saves.

const API = 'https://api.github.com'

export interface Issue {
  number: number
  body: string
  title: string
}

export class GitHubClient {
  constructor(
    private readonly token: string,
    private readonly repo: string,
  ) {}

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${this.token}`,
        'content-type': 'application/json',
        'x-github-api-version': '2022-11-28',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    if (!response.ok) {
      const detail = await response.text()
      throw new Error(
        `GitHub API ${method} ${path} failed: ${response.status} ${response.statusText}\n${detail}`,
      )
    }

    return (await response.json()) as T
  }

  getIssue(number: number): Promise<Issue> {
    return this.request<Issue>('GET', `/repos/${this.repo}/issues/${number}`)
  }

  updateIssueBody(number: number, body: string): Promise<Issue> {
    return this.request<Issue>(
      'PATCH',
      `/repos/${this.repo}/issues/${number}`,
      { body },
    )
  }

  comment(number: number, body: string): Promise<unknown> {
    return this.request(
      'POST',
      `/repos/${this.repo}/issues/${number}/comments`,
      { body },
    )
  }
}
