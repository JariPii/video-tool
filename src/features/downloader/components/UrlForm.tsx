'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UrlFormProps {
  url: string;
  loading: boolean;
  onUrlChange(value: string): void;
  onSubmit(): void;
}

const UrlForm = ({ url, loading, onSubmit, onUrlChange }: UrlFormProps) => {
  return (
    <div className='space-y-3'>
      <Input
        type='text'
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder='Paste in URL here'
        className='w-full border-2 border-black p-2'
      />
      <Button onClick={onSubmit} disabled={loading || !url.trim()}>
        {loading ? 'Loading...' : 'Get video info'}
      </Button>
    </div>
  );
};

export default UrlForm;
