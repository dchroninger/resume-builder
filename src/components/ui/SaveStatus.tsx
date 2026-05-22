interface SaveStatusProps {
  status: 'saved' | 'saving';
}

export function SaveStatus({ status }: SaveStatusProps) {
  return (
    <div className={'save-status' + (status === 'saving' ? ' saving' : '')}>
      <span className="pulse" />
      <span>{status === 'saving' ? 'Saving…' : 'Saved'}</span>
    </div>
  );
}
