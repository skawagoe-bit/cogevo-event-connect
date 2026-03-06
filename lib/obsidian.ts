export const OBSIDIAN_VAULT_KEY = "obsidian_vault";
export const OBSIDIAN_FOLDER_KEY = "obsidian_folder";

type VisitorNoteInput = {
  eventName?: string;
  name?: string | null;
  company?: string | null;
  email?: string | null;
  attribute?: string | null;
  segment?: string | null;
  memo?: string | null;
  visitDate?: string | null;
};

const INVALID_PATH_CHARS_REGEX = /[\\/#|?*:"<>]/g;

function sanitizePathSegment(value: string): string {
  return value.replace(INVALID_PATH_CHARS_REGEX, "-").trim();
}

function sanitizeFolderPath(folder: string): string {
  return folder
    .split("/")
    .map((segment) => sanitizePathSegment(segment))
    .filter(Boolean)
    .join("/");
}

function resolveDateString(visitDate?: string | null): string {
  if (visitDate && /^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
    return visitDate;
  }
  return new Date().toISOString().split("T")[0];
}

export function buildObsidianFilePath(params: {
  folder?: string;
  visitDate?: string | null;
  name?: string | null;
  company?: string | null;
}): string {
  const folderPath = sanitizeFolderPath(params.folder || "");
  const datePart = resolveDateString(params.visitDate);
  const titleSeed = [params.company, params.name].filter(Boolean).join("_");
  const title = sanitizePathSegment(titleSeed || "visitor");
  const fileName = `${datePart}_${title}`;
  return folderPath ? `${folderPath}/${fileName}` : fileName;
}

export function buildVisitorNoteMarkdown(input: VisitorNoteInput): string {
  const lines = [
    `# ${input.name || input.company || "来場者メモ"}`,
    "",
    "## 基本情報",
    `- イベント: ${input.eventName || "未設定"}`,
    `- 会社名: ${input.company || "未設定"}`,
    `- 氏名: ${input.name || "未設定"}`,
    `- メール: ${input.email || "未設定"}`,
    `- 属性: ${input.attribute || "未設定"}`,
    `- 区分: ${input.segment || "未設定"}`,
    `- 訪問日: ${resolveDateString(input.visitDate)}`,
    "",
    "## 商談メモ",
    input.memo || "",
    "",
    `作成元: CogEvo Event Connect (${new Date().toLocaleString("ja-JP")})`,
  ];

  return lines.join("\n");
}

export function buildObsidianNewNoteUri(params: {
  vault: string;
  filePath: string;
  content: string;
}): string {
  const vault = params.vault.trim();
  return `obsidian://new?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(
    params.filePath
  )}&content=${encodeURIComponent(params.content)}`;
}
