import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import {cn} from '@/lib/utils';

interface LinkRendererProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
}
function LinkRenderer(props: LinkRendererProps) {
  return (
    <a href={props.href} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-500">
      {props.children}
    </a>
  );
}

const TextMd: React.FC<TextMdProps> = ({text, className}) => {
  return (
    <ReactMarkdown
      className={cn('text-code', className)}
      remarkPlugins={[remarkParse, remarkMath, remarkGfm, remarkStringify]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={{
        a: LinkRenderer
      }}
    >
      {text}
    </ReactMarkdown>
  );
};

interface TextMdProps {
  text: string;
  className?: string;
}

export default TextMd;
