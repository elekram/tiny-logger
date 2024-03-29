# Tiny Logger 🌱
## A simple, no fuss and slightly opinionated logger for Deno.  
Logs to console and also writes log entries to either a Csv file or Txt file with Json objects.
- CSV file (.csv)
- JSON Objects (.txt)

Csv log files are often a convenient format and are TinyLogger's default, however this can be easily changed to Json objects written to a .txt file as shown in the LogOption interface below. Additional logfiles will be generated when maxBytes is reached and appended with an incremented number.

Source and message function parameters are required to log a message. See usage examples below.

Log file names are opinionated and stamped with the TinyLogger object's instantiation date and time however they can have a custom label. 

Example file names:

- Default: **log.2023-01-21T00-34-15.csv|txt**
- Or with example *'myCoolApp'* logLabel specified: **myCoolApp.log.2023-01-21T00-34-15.csv|txt**

## Usage

```typescript
interface LogOptions {
  format?: 'csv' | 'json' // file extensions respectively are .csv or .txt file
  disableConsoleLogging?: boolean // don't write to console
  consoleOutput?: 'raw' | 'pretty'
  logLabel?: string // <logLabel>.log.<instantiation-date-time>.csv|txt
  maxBytes?: number // default 10mb
}

debug(source: string, message: string)
info(source: string, message: string)
warn(source: string, message: string)
error(source: string, message: string)

// Basic usage with interface defaults and file logging disabled
const logger = new TinyLogger
logger.error('Some Module', 'Oh snap! Something went wrong :(')

// Advanced usage with custom options specified and file logging enabled
const logger = new TinyLogger({
  maxBytes: 5242880, format: 'json', consoleOutput: 'raw'
})
await logger.enableFileLogging('./logs') // path is optional defaults to current directory

logger.error('Some Module', 'Oh snap! Something went wrong :(')
```
## Pretty console output
<img src='https://drive.google.com/uc?id=1BkolBle9-wQzS5KaJ4QVWpuDEve7Bfx2' width="40%">

## Raw console output
<img src='https://drive.google.com/uc?id=1hUWa89k0RUh6K4K4V0CFDsnyr6F8vQ9s'>


