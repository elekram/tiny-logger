export type LogOptions = {
  logLevel?: 'info' | 'warn' | 'error'
  supressConsoleOutput?: boolean
  fileName?: string
}

export async function log(type: string, message: string, options: LogOptions) {
  const supressConsoleOutput = options.supressConsoleOutput || false
  const logLevel = options.logLevel || 'info'
  const fileName = options.fileName || './log.csv'

  const date = new Date()

  const logColourIndex: Map<string, string> = new Map(
    Object.entries(
      { info: 'green', warn: 'yellow', error: 'red' }
    )
  )

  const d = date.toISOString()
  const t = type
  const m = removeCommas(message)
  const l = logLevel

  if (!supressConsoleOutput) {
    console.log(`%c${d}, ${l.toUpperCase()}, ${t}, ${m}`, `color: ${logColourIndex.get(l)};`)
  }

  const csvRow = `"${d}","${l.toUpperCase()}","${t}","${m}"\r\n`
  await writeFile(csvRow, fileName)
}

async function writeFile(s: string, fileName: string) {
  await Deno.writeTextFile(fileName, s, { append: true })
}

function removeCommas(s: string) {
  const sanitised = s.replace(/[,]+/g, '')
  return sanitised
}
