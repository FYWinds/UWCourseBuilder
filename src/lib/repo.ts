export const REPO_URL = 'https://github.com/FYWinds/UWCourseBuilder'

/** Issue form templates in .github/ISSUE_TEMPLATE. */
export type IssueTemplate = 'data-error' | 'requirement-error' | 'algorithm-error' | 'ui-problem' | 'feature-request'

/** New-issue URL for a form template; `fields` pre-fill form inputs by id (GitHub issue forms). */
export function issueUrl(template: IssueTemplate, fields: Record<string, string> = {}): string {
  const params = new URLSearchParams({ template: `${template}.yml`, ...fields })
  return `${REPO_URL}/issues/new?${params}`
}

export const ISSUE_CHOOSER_URL = `${REPO_URL}/issues/new/choose`
