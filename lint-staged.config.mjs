const filterLintFiles = (stagedFiles) =>
    stagedFiles.filter((file) => file !== 'src/cli.ts')

const config = {
    '*.{cjs,mjs,js,ts,jsx,tsx}': (stagedFiles) => {
        const files = filterLintFiles(stagedFiles)
        if (files.length === 0) {
            return []
        }
        return [
            `eslint --fix ${files.join(' ')}`,
            `prettier --write ${files.join(' ')}`,
        ]
    },
    '*.{css,md,mdx,json}': (stagedFiles) => [
        `prettier --write ${stagedFiles.join(' ')}`,
    ],
}
export default config
