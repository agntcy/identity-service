import {useCallback, useEffect, useState} from 'react';
import copy from 'copy-to-clipboard';
import {Button} from './button';
import {CheckIcon, CopyIcon} from 'lucide-react';

const TIMEOUT = 2000;

export type CopyButtonProps = {
  text: string;
  onCopy?: () => void;
};

export const CopyButton = ({text, onCopy}: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    if (isCopied) {
      timeout = setTimeout(() => {
        setIsCopied(false);
      }, TIMEOUT);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isCopied]);

  const handleOnCopy = useCallback(() => {
    copy(text);
    setIsCopied(true);
    onCopy?.();
  }, [onCopy, text]);

  return (
    <Button onClick={handleOnCopy} variant="outline" size="icon" className="copy-button">
      {isCopied ? <CheckIcon stroke="green" /> : <CopyIcon stroke="#062242" />}
    </Button>
  );
};
