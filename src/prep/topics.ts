import type { Level, PrepTopic } from "./types";

export const TOPICS: readonly PrepTopic[] = [
  { id: "dsa", label: "DSA", kind: "fundamentals" },
  { id: "systemdesign", label: "System Design", kind: "fundamentals" },
  { id: "ml", label: "Machine Learning", kind: "fundamentals" },
  { id: "ai", label: "AI (GenAI & LLMs)", kind: "fundamentals" },
  { id: "csbasics", label: "CS Fundamentals", kind: "fundamentals" },
  { id: "python", label: "Python", kind: "language" },
  { id: "javascript", label: "JavaScript", kind: "language" },
  { id: "typescript", label: "TypeScript", kind: "language" },
  { id: "react", label: "React", kind: "language" },
  { id: "nodejs", label: "Node.js", kind: "language" },
  { id: "java", label: "Java", kind: "language" },
  { id: "kotlin", label: "Kotlin", kind: "language" },
  { id: "csharp", label: "C#", kind: "language" },
  { id: "cpp", label: "C++", kind: "language" },
  { id: "c", label: "C", kind: "language" },
  { id: "go", label: "Go", kind: "language" },
  { id: "rust", label: "Rust", kind: "language" },
  { id: "swift", label: "Swift", kind: "language" },
  { id: "ruby", label: "Ruby", kind: "language" },
  { id: "php", label: "PHP", kind: "language" },
  { id: "scala", label: "Scala", kind: "language" },
  { id: "dart", label: "Dart / Flutter", kind: "language" },
  { id: "bash", label: "Bash / Shell", kind: "language" },
  { id: "sql", label: "SQL (general)", kind: "database" },
  { id: "postgresql", label: "PostgreSQL", kind: "database" },
  { id: "mysql", label: "MySQL", kind: "database" },
  { id: "sqlite", label: "SQLite", kind: "database" },
  { id: "sqlserver", label: "SQL Server", kind: "database" },
  { id: "oracle", label: "Oracle", kind: "database" },
  { id: "mongodb", label: "MongoDB", kind: "database" },
  { id: "redis", label: "Redis", kind: "database" },
  { id: "cassandra", label: "Cassandra", kind: "database" },
  { id: "dynamodb", label: "DynamoDB", kind: "database" },
  { id: "elasticsearch", label: "Elasticsearch", kind: "database" },
  { id: "neo4j", label: "Neo4j", kind: "database" },
];

export const TOPIC_BY_ID: ReadonlyMap<string, PrepTopic> = new Map(TOPICS.map((t) => [t.id, t]));

export const topicLabel = (id: string): string => TOPIC_BY_ID.get(id)?.label ?? id;

export const LEVEL_NAMES: Record<Level, string> = {
  1: "Basics", 2: "Basics", 3: "Easy", 4: "Easy", 5: "Medium",
  6: "Medium", 7: "Hard", 8: "Hard", 9: "Expert", 10: "Expert",
};

/** Where a new session starts, by self-assessed experience. */
export const START_LEVELS = [
  { level: 1, label: "Beginner" },
  { level: 4, label: "Intermediate" },
  { level: 7, label: "Advanced" },
] as const satisfies readonly { level: Level; label: string }[];
