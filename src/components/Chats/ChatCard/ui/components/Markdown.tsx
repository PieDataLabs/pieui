import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'
import { useEffect, useState } from 'react'

function MarkdownRender({ children }: { children: string }) {
    const [content, setContent] = useState<string>(children)

    useEffect(() => {
        setContent(children)
    }, [children])

    return (
        <div className='max-w-full first:mt-0'>
            <ReactMarkdown
                rehypePlugins={[rehypeHighlight]}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}

export default MarkdownRender
