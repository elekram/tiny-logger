// Copyright 2023 Mark Lee (mlee.aus@gmail.com). All rights reserved. MIT license.
import { stringify, Column } from "https://deno.land/std@0.170.0/encoding/csv.ts";

export interface LogOptions {
  format?: 'csv' | 'json'
  supressConsoleOutput?: boolean
  logLabel?: string // <app name>.log.<date-time>.csv|txt
  maxBytes?: number // default 10mb
}

export class TinyLogger {
  #logLabel: string
  #format: 'csv' | 'json'
  #supressConsoleOutput: boolean
  #maxBytes: number

  readonly logInstantiationTime = getFormattedDateTime()
  #currentLogFile = ''
  #currentLogFileNumber = 0

  #logColors: Map<string, string> = new Map(
    Object.entries(
      { debug: 'light-blue', info: 'cyan', warn: 'yellow', error: 'red' }
    )
  )

  constructor(options: LogOptions) {
    this.#format = options.format || 'csv'
    this.#supressConsoleOutput = options.supressConsoleOutput || false
    this.#logLabel = options.logLabel || 'log'
    this.#maxBytes = options.maxBytes || 10485760
  }

  public async debug(subject: string, message: string) {
    const level = 'DEBUG'

    const data = formatData(this.#format, level, subject, message)
    await this.writeFile(data, this.#logLabel, this.#format)

    if (!this.#supressConsoleOutput) {
      this.logToConsole(level, subject, message)
    }
  }

  public async info(subject: string, message: string) {
    const level = 'INFO'

    const data = formatData(this.#format, level, subject, message)
    await this.writeFile(data, this.#logLabel, this.#format)

    if (!this.#supressConsoleOutput) {
      this.logToConsole(level, subject, message)
    }
  }

  public async warn(subject: string, message: string) {
    const level = 'WARN'

    const data = formatData(this.#format, level, subject, message)
    await this.writeFile(data, this.#logLabel, this.#format)

    if (!this.#supressConsoleOutput) {
      this.logToConsole(level, subject, message)
    }
  }

  public async error(subject: string, message: string) {
    const level = 'ERROR'

    const data = formatData(this.#format, level, subject, message)
    await this.writeFile(data, this.#logLabel, this.#format)

    if (!this.#supressConsoleOutput) {
      this.logToConsole(level, subject, message)
    }
  }

  private logToConsole(
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
    subject: string,
    message: string
  ) {
    const dt = getDateTime()
    const outputColor = this.#logColors.get(level.toLowerCase())
    console.log(`%c[ ${level}, ${dt}, ${subject}, ${message} ]`, `color: ${outputColor};`)
  }

  private async writeFile(data: string, logLabel: string, format: 'csv' | 'json') {
    if (!isAlphanumeric(logLabel)) {
      throw 'Error: TinyLogger loglabel contains invalid characters. Label can be alphanumeric characters only.'
    }

    let fileToWrite = ''

    let label = logLabel
    if (logLabel !== 'log') {
      label = `${logLabel}.log`
    }

    if (!this.#currentLogFile) {
      fileToWrite = format === 'csv' ?
        `${label}.${this.logInstantiationTime}.csv` :
        `${label}.${this.logInstantiationTime}.txt`
    } else {
      fileToWrite = this.#currentLogFile
    }

    try {
      const file = await Deno.stat(fileToWrite)

      if (file.isFile && file.size > this.#maxBytes) {
        this.#currentLogFileNumber++

        const nextFileToWrite = format === 'csv' ?
          `${label}.${this.logInstantiationTime}_${this.#currentLogFileNumber}.csv` :
          `${label}.${this.logInstantiationTime}_${this.#currentLogFileNumber}.txt`

        this.#currentLogFile = nextFileToWrite
        fileToWrite = nextFileToWrite

        console.log("current:", this.#currentLogFile)
        console.log("new:", fileToWrite)
        console.log("File size exceeded:", file.size);

        try {
          await Deno.writeTextFile(fileToWrite, data, { append: true })
        } catch (e) {
          console.error(e.message)
        }
      } else {
        this.#currentLogFile = fileToWrite
        try {
          await Deno.writeTextFile(fileToWrite, data, { append: true })
        } catch (e) {
          console.error(e.message)
        }
      }
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        try {
          this.#currentLogFile = fileToWrite
          await Deno.writeTextFile(fileToWrite, data, { append: true })
        } catch (e) {
          console.error(e.message)
        }
      } else {
        console.error(e)
      }
    }
  }
}

function getFormattedDateTime() {
  const dateTime = new Date()
  const dtArray = dateTime.toJSON().split('T')

  const time = dtArray[1]
  const timeSansMiliseconds = time.split('.')[0]
  const timeForFileName = timeSansMiliseconds.replaceAll(':', '-')

  const formattedDateTime = `${dtArray[0]}T${timeForFileName}`

  return formattedDateTime
}

function getDateTime() {
  const d = new Date()
  return d.toISOString().split('.')[0] + 'Z'
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
  level: string,
  subject: string,
  message: string
) {
  let data: string
  const date = getDateTime()

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
