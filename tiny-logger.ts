import * as dateTime from 'https://deno.land/std@0.162.0/datetime/mod.ts'

export type LogOptions = {
  logLevel?: 'info' | 'warn' | 'error'
  supressConsoleOutput?: boolean
  fileName?: string
}


export async function log(type: string, message: string, options: LogOptions) {
  const supressConsoleOutput = options.supressConsoleOutput || false
  const logLevel = options.logLevel || 'info'
  const fileName = options.fileName || './log.csv'

  const date = dateTime.format(new Date(), "yyyy-MM-dd HH:mm:ss")

  const logColourIndex: Map<string, string> = new Map(
    Object.entries(
      { info: 'green', warn: 'yellow', error: 'red' }
    )
  )

  const t = type
  const m = removeCommas(message)
  const l = logLevel

  if (!supressConsoleOutput) {
    console.log(`%c${l.toUpperCase()}, ${date}, ${t}, ${m}`, `color: ${logColourIndex.get(l)};`)
  }

  const csvRow = `"${l.toUpperCase()}","${date}","${t}","${m}"\r\n`
  await writeFile(csvRow, fileName)
}

async function writeFile(s: string, fileName: string) {
  await Deno.writeTextFile(fileName, s, { append: true })
}

function removeCommas(s: string) {
  const sanitised = s.replace(/[,]+/g, '')
  return sanitised
}
