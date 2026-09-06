/** What every action hook may need from the provider. */
export interface ActionDeps {
  logActivity: (action: string, target: string, description: string) => void;
  /** Names the record in a log line, or falls back to the plain prefix. */
  describeAction: (prefix: string, id: string) => string;
}
