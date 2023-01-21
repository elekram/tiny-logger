# Tiny Logger 🌱
## A simple, no fuss and slightly opionionated logger for Deno.  
Logs to console and also writes log entries to either a Csv file or Txt file with Json objects.
- CSV file (.csv)
- JSON Objects (.txt)

Csv log files are often a convenient format and are TinyLogger's default, however this can be easily changed to Json objects written to a .txt file as shown in the LogOption interface below. Additional logfiles will be generated when maxBytes is reached and appended with a incrementing number.

A source and message function parameters are required to log a message. See usage examples below.

Log file names are opinionated and stamped with the TinyLogger object's instantiation date and time however they can have a custom label. 

Example file names:

- Default: **log.2023-01-21T00-34-15.csv|txt**
- Or with example *'myCoolApp'* logLabel specified: **myCoolApp.log.2023-01-21T00-34-15.csv|txt**

## Usage

```typescript
interface LogOptions {
  format?: 'csv' | 'json' // default csv. File extensions respectively are .csv or .txt
  disableConsoleLogging?: boolean // default false
  disableFileLogging?: boolean // default false
  consoleOutput?: 'raw' | 'pretty' // default pretty
  logLabel?: string // <logLabel>.log.<logger-instantiation-date-time>.csv|txt
  path?: string // defaults to current directory
  maxBytes?: number // default 10mb
}

debug(source: string, message: string)
info(source: string, message: string)
warn(source: string, message: string)
error(source: string, message: string)

// Basic usage with interface defaults
const logger = new TinyLogger
logger.error('Some Module', 'Oh snap! Something went wrong :(')

// Advanced usage with custom options specified
const logger = new TinyLogger({
  path: './logs', maxBytes: 5242880, format: 'json', consoleOutput: 'raw'
})
logger.error('Some Module', 'Oh snap! Something went wrong :(')
```
