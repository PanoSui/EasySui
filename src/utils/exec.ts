import { spawn } from 'child_process'

export function execCmd(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, { shell: true })

        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (data) => {
            stdout += data.toString()
        })

        child.stderr.on('data', (data) => {
            stderr += data.toString()
        })

        child.on('error', (err) => reject(err))

        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout.trim())
            } else {
                const output =
                    [stderr.trim(), stdout.trim()]
                        .filter(Boolean)
                        .join('\n') || `Process exited with code ${code}`

                reject(new Error(`Publish bytes command failed:\n${output}`))
            }
        })
    })
}
