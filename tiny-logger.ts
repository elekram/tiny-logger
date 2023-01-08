// Copyright 2023 Mark Lee (mlee.aus@gmail.com). All rights reserved. MIT license.
import { stringify, Column } from "https://deno.land/std@0.170.0/encoding/csv.ts"
import { writeAll } from "https://deno.land/std@0.171.0/streams/write_all.ts"

export interface LogOptions {
  format?: 'csv' | 'json' // file extensions respectively are .csv or .txt file
  disableConsoleLogging?: boolean // don't write to console
  disableFileLogging?: boolean
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
  readonly instantiation = getInstantiation()
  #format: 'csv' | 'json'
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
    this.#path = options.path || './'
    this.#maxBytes = options.maxBytes || 10485760
    this.#disableConsoleLogging = options.disableConsoleLogging || false
    this.#disableFileLogging = options.disableFileLogging || false
    this.init()
  }

  private async init() {
    if (this.#disableConsoleLogging && this.#disableFileLogging) {
      throw `TinyLogger Error: file logging and console logging are both disabled.`
    }

    if (!this.#disableFileLogging) {
      await this.testFileLogging()
    }

    if (!isAlphanumeric(this.#logLabel)) {
      throw 'TinyLogger Error: loglabel contains invalid characters. Label can be alphanumeric characters only.'
    }

    if (this.#logLabel !== 'log') {
      this.#logLabel = `${this.#logLabel}.log`
    }

    const initialFile = this.#format === 'csv' ?
      `${this.#logLabel}.${this.instantiation}.csv` :
      `${this.#logLabel}.${this.instantiation}.txt`

    this.#currentLogFile = this.#path + initialFile
  }

  debug(subject: string, message: string) {
    const data = formatData(this.#format, LogLevels.Debug, subject, message)

    if (!this.#disableConsoleLogging) {
      this.logToConsole(LogLevels.Debug, subject, message)
    }

    if (!this.#disableFileLogging) {
      this.writeFile(data)
    }
  }

  info(subject: string, message: string) {
    const data = formatData(this.#format, LogLevels.Info, subject, message)

    if (!this.#disableConsoleLogging) {
      this.logToConsole(LogLevels.Info, subject, message)
    }

    if (!this.#disableFileLogging) {
      this.writeFile(data)
    }
  }

  warn(subject: string, message: string) {
    const data = formatData(this.#format, LogLevels.Error, subject, message)

    if (!this.#disableConsoleLogging) {
      this.logToConsole(LogLevels.Error, subject, message)
    }

    if (!this.#disableFileLogging) {
      this.writeFile(data)
    }
  }

  error(subject: string, message: string) {
    const data = formatData(this.#format, LogLevels.Error, subject, message)

    if (!this.#disableConsoleLogging) {
      this.logToConsole(LogLevels.Error, subject, message)
    }

    if (!this.#disableFileLogging) {
      this.writeFile(data)
    }
  }

  private async testFileLogging() {
    try {
      await Deno.lstat(this.#path);
    } catch (err) {
      if (err instanceof Deno.errors.NotFound) {
        throw `TinyLogger Error: Invalid Path '${this.#path}'`
      }
      throw err;
    }
  }

  private logToConsole(
    level: LogLevels,
    subject: string,
    message: string
  ) {
    const dt = (new Date()).toISOString()
    const outputColor = this.#logColors.get(level.toString())
    console.log(`%c[ ${level}, ${dt}, ${subject}, ${message} ]`, `color: ${outputColor};`)
  }

  private async writeFile(data: string) {
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
        `${this.#logLabel}.${this.instantiation}_${this.#logFileNumber}.csv` :
        `${this.#logLabel}.${this.instantiation}_${this.#logFileNumber}.txt`

      this.#currentLogFile = this.#path + nextFileToWrite

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

function getEol() {
  const os = Deno.build.os
  const eol = os === 'windows' ? '\r\n' : '\n'
  return eol
}

function isAlphanumeric(s: string) {
  return /^[A-Za-z0-9]*$/.test(s);
}

function formatData(
  format: 'csv' | 'json',
  level: LogLevels,
  subject: string,
  message: string
) {
  let data: string
  const date = (new Date()).toISOString()

  switch (format) {
    case 'csv': {
      const columns: Column = [
        'level',
        'date',
        'subject',
        'message'
      ]

      data = stringify(
        [{
          level,
          date,
          subject,
          message
        }], { columns, headers: false }
      )
    }
      break

    case 'json': {
      data = JSON.stringify({
        level,
        date,
        subject,
        message
      }) + getEol()
    }
      break
  }

  return data
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
