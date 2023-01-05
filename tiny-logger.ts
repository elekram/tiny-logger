// Copyright 2023 Mark Lee (mlee.aus@gmail.com). All rights reserved. MIT license.
import { stringify, Column } from "https://deno.land/std@0.170.0/encoding/csv.ts";

export interface LogOptions {
  format?: 'csv' | 'json'
  supressConsoleOutput?: boolean
  fileName?: string
}

export class TinyLogger {
  #logLabel: string
  #format: 'csv' | 'json'
  #supressConsoleOutput: boolean

  readonly logInstantiationTime = getFormattedDateTime()

  #logColors: Map<string, string> = new Map(
    Object.entries(
      { info: 'green', warn: 'yellow', error: 'red' }
    )
  )

  constructor(options: LogOptions) {
    this.#format = options.format || 'csv'
    this.#supressConsoleOutput = options.supressConsoleOutput || false
    this.#logLabel = options.fileName || 'log'
  }

  public async info(subject: string, message: string) {
    const level = 'INFO'

    const data = await formatData(this.#format, level, subject, message)
    await this.writeFile(data, this.#logLabel, this.#format)

    if (!this.#supressConsoleOutput) {
      this.logToConsole(level, subject, message)
    }
  }

  public async warn(subject: string, message: string) {
    const level = 'WARN'

    const data = await formatData(this.#format, level, subject, message)
    await this.writeFile(data, this.#logLabel, this.#format)

    if (!this.#supressConsoleOutput) {
      this.logToConsole(level, subject, message)
    }
  }

  public async error(subject: string, message: string) {
    const level = 'ERROR'

    const data = await formatData(this.#format, level, subject, message)
    await this.writeFile(data, this.#logLabel, this.#format)

    if (!this.#supressConsoleOutput) {
      this.logToConsole(level, subject, message)
    }
  }

  private logToConsole(
    level: 'INFO' | 'WARN' | 'ERROR',
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

    let l = logLabel
    if (logLabel !== 'log') {
      l = `${logLabel}.log`
    }

    const dt = this.logInstantiationTime

    const f = format === 'csv' ?
      `${l}.${dt}.csv` :
      `${l}.${dt}.txt`

    try {
      await Deno.writeTextFile(f, data, { append: true })
    } catch (e) {
      console.error(e.message)
    }
  }
}

function getFormattedDateTime() {
  const d = new Date()
  const dateTime = d.toJSON().split('T')

  const time = dateTime[1]
  const timeWithoutMiliseconds = time.split('.')[0]
  const timeForFilename = timeWithoutMiliseconds.replaceAll(':', '-')

  const formattedDateTime = `${dateTime[0]}T${timeForFilename}`

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

async function formatData(
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

      data = await stringify(
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
