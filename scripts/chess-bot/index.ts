// Entry point, run by .github/workflows/chess-bot.yml on issue comments.

import { applyCommand } from './apply'
import { parseComment } from './commands'
import { GitHubClient } from './github'
import { renderIssueBody } from './render'
import { EMPTY_STATE, readState, writeState } from './state'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable ${name}`)
  return value
}

async function main(): Promise<void> {
  const commentBody = process.env.COMMENT_BODY ?? ''
  const command = parseComment(commentBody)

  // Not addressed to the bot — stay quiet rather than replying to every comment.
  if (!command) {
    console.log('No /chess command found; nothing to do.')
    return
  }

  const token = required('GITHUB_TOKEN')
  const repo = required('GITHUB_REPOSITORY')
  const issueNumber = Number(required('ISSUE_NUMBER'))
  const actor = process.env.COMMENT_AUTHOR ?? 'someone'

  const client = new GitHubClient(token, repo)

  if (command.kind === 'error') {
    await client.comment(issueNumber, command.message)
    return
  }

  const issue = await client.getIssue(issueNumber)
  const state = readState(issue.body ?? '') ?? EMPTY_STATE
  const outcome = applyCommand(state, command, actor)

  if (!outcome.ok) {
    await client.comment(issueNumber, outcome.reply)
    return
  }

  if (outcome.boardChanged) {
    const body = writeState(renderIssueBody(outcome.game), outcome.state)
    await client.updateIssueBody(issueNumber, body)
  }

  await client.comment(issueNumber, outcome.reply)
  console.log(`Handled /chess ${command.kind} from ${actor} on issue #${issueNumber}.`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
