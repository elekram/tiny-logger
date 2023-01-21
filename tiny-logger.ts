// Copyright 2023 Mark Lee (mlee.aus@gmail.com). All rights reserved. MIT license.
import { stringify, Column } from "https://deno.land/std@0.170.0/encoding/csv.ts"
import { writeAll } from "https://deno.land/std@0.171.0/streams/write_all.ts"

export interface LogOptions {
  format?: 'csv' | 'json' // file extensions respectively are .csv or .txt file
  disableConsoleLogging?: boolean // don't write to console
  disableFileLogging?: boolean
  consoleOutput?: 'raw' | 'pretty'
  logLabel?: string // <logLabel>.log.<instantiation-date-time>.csv|txt
  path?: string // log path defaults to current directory
  maxBytes?: number // default 10mb
}

enum LogLevels {
  Debug = 'DEBUG',
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERROR'
}

export class TinyLogger {
  #instantiation = getInstantiation()
  #format: 'csv' | 'json'
  #consoleOutput: 'raw' | 'pretty'
  #logLabel: string
  #path: string
  #disableConsoleLogging: boolean
  #disableFileLogging: boolean
  #encoder = new TextEncoder()
  #maxBytes: number
  #byteLength = 0
  #currentLogFile = ''
  #logFileNumber = 0

  #logColors: Map<string, string> = new Map(
    Object.entries(
      { DEBUG: 'light-blue', INFO: 'cyan', WARN: 'yellow', ERROR: 'red' }
    )
  )

  constructor(options: LogOptions) {
    this.#format = options.format || 'csv'
    this.#logLabel = options.logLabel || 'log'
    this.#consoleOutput = options.consoleOutput || 'pretty'
    this.#path = options.path || './'
    this.#maxBytes = options.maxBytes || 10485760
    this.#disableConsoleLogging = options.disableConsoleLogging || false
    this.#disableFileLogging = options.disableFileLogging || false
    this.init()
  }

  private async init() {
    if (this.#disableConsoleLogging && this.#disableFileLogging) {
      throw `TinyLogger Error: file logging and console logging cannot both be disabled.`
    }

    if (!isAlphanumeric(this.#logLabel)) {
      throw 'TinyLogger Error: loglabel contains invalid characters. Label can be alphanumeric characters only.'
    }

    if (!this.#disableFileLogging) {
      await testFilePath(this.#path)
    }

    const path = getPathString(this.#path)

    if (this.#logLabel !== 'log') {
      this.#logLabel = `${this.#logLabel}.log`
    }

    const initialFile = this.#format === 'csv' ?
      `${this.#logLabel}.${this.#instantiation}.csv` :
      `${this.#logLabel}.${this.#instantiation}.txt`

    this.#currentLogFile = path + initialFile
  }

  debug(source: string, message: string) {
    const data = formatData(this.#format, LogLevels.Debug, source, message)

    if (!this.#disableConsoleLogging) {
      this.logToConsole(LogLevels.Debug, source, message)
    }

    if (!this.#disableFileLogging) {
      this.writeFile(data)
    }
  }

  info(source: string, message: string) {
    const data = formatData(this.#format, LogLevels.Info, source, message)

    if (!this.#disableConsoleLogging) {
      this.logToConsole(LogLevels.Info, source, message)
    }

    if (!this.#disableFileLogging) {
      this.writeFile(data)
    }
  }

  warn(source: string, message: string) {
    const data = formatData(this.#format, LogLevels.Warn, source, message)

    if (!this.#disableConsoleLogging) {
      this.logToConsole(LogLevels.Warn, source, message)
    }

    if (!this.#disableFileLogging) {
      this.writeFile(data)
    }
  }

  error(source: string, message: string) {
    const data = formatData(this.#format, LogLevels.Error, source, message)

    if (!this.#disableConsoleLogging) {
      this.logToConsole(LogLevels.Error, source, message)
    }

    if (!this.#disableFileLogging) {
      this.writeFile(data)
    }
  }

  private logToConsole(
    level: LogLevels,
    source: string,
    message: string
  ) {
    const time = (new Date()).toISOString()
    const outputColor = this.#logColors.get(level)

    const data = JSON.stringify({
      time,
      [level]: source,
      message
    })

    switch (this.#consoleOutput) {
      case 'raw':
        console.log(`%c${data}`, `color: ${outputColor};`)
        break

      case 'pretty':
        console.log(`%c[${time}] ${level}: ${source}`, `color: ${outputColor};`)
        console.log(`%c${message}\n`, `color: light-blue;`)
        break

    }
  }

  private async writeFile(data: string) {
    const path = getPathString(this.#path)

    const newMessageBytes = this.#encoder.encode(data).byteLength
    this.#byteLength += newMessageBytes

    const file = Deno.openSync(
      this.#currentLogFile,
      { read: true, write: true, create: true, append: true }
    )

    if (this.#byteLength > this.#maxBytes) {
      this.#byteLength = 0
      this.#logFileNumber++

      const nextFileToWrite = this.#format === 'csv' ?
        `${this.#logLabel}.${this.#instantiation}_${this.#logFileNumber}.csv` :
        `${this.#logLabel}.${this.#instantiation}_${this.#logFileNumber}.txt`

      this.#currentLogFile = path + nextFileToWrite

      const nextFile = Deno.openSync(
        this.#currentLogFile,
        { read: true, write: true, create: true, append: true }
      )

      await writeAll(nextFile, this.#encoder.encode(data))
      nextFile.close()
    } else {
      await writeAll(file, this.#encoder.encode(data))
      file.close()
    }
  }
}

function isAlphanumeric(s: string) {
  return /^[A-Za-z0-9]*$/.test(s);
}

function getPathString(path: string) {
  if (path !== './') {
    path = path[path.length - 1] === '/' ?
      path :
      path + '/'
  }
  return path
}

function formatData(
  format: 'csv' | 'json',
  level: LogLevels,
  source: string,
  message: string
) {
  let data: string
  const time = (new Date()).toISOString()

  switch (format) {
    case 'csv': {
      const columns: Column = [
        'time',
        'level',
        'source',
        'message'
      ]

      data = stringify(
        [{
          time,
          level,
          source,
          message
        }], { columns, headers: false }
      )
    }
      break

    case 'json': {
      data = JSON.stringify({
        time,
        level,
        source,
        message
      }) + '\n'
    }
      break
  }

  return data
}

async function testFilePath(path: string) {
  try {
    await Deno.lstat(path);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      throw `TinyLogger Error: Invalid Path '${path}'`
    }
    throw err;
  }
}

function getInstantiation() {
  const dateTime = new Date()
  const dtArray = dateTime.toJSON().split('T')

  const time = dtArray[1]
  const timeSansMiliseconds = time.split('.')[0]
  const timeForFileName = timeSansMiliseconds.replaceAll(':', '-')

  const formattedDateTime = `${dtArray[0]}T${timeForFileName}`

  return formattedDateTime
}
