import { useState } from 'react';
import { Button, FileTrigger } from 'react-aria-components';
import { NavLink } from 'react-router';

import { CodeEditor } from '~/ui/components/.client/codemirror/code-editor';

const Sandbox = () => {
  const [file, setFile] = useState<string>('');
  const [secondsTaken, setSecondsTaken] = useState<number>(0);
  const [generating, setGenerating] = useState<boolean>(false);
  return (
    <div className="flex h-full w-full flex-col items-start justify-start p-2 text-[--color-font]">
      <div className="m-3 flex w-full flex-shrink-0 flex-row items-center gap-2">
        <NavLink
          className="rounded-sm border border-solid border-[--hl-sm] px-4 py-2 text-base text-[--color-font] ring-1 ring-transparent transition-all hover:bg-[--hl-xs] focus:ring-inset focus:ring-[--hl-md] aria-pressed:bg-[--hl-sm] aria-selected:bg-[--hl-sm]"
          to="/"
        >
          Home
        </NavLink>
        <FileTrigger
          allowsMultiple={false}
          acceptedFileTypes={['.yaml', '.json', '.yml']}
          onSelect={async fileList => {
            if (!fileList) return;
            const files = Array.from(fileList);
            if (files.length === 0) return;
            const contents = await window.main.readFile({ path: window.webUtils.getPathForFile(files[0]) });
            setFile(contents.content);
          }}
        >
          <Button
            className="rounded-sm border border-solid border-[--hl-sm] px-4 py-2 text-base text-[--color-font] ring-1 ring-transparent transition-all hover:bg-[--hl-xs] focus:ring-inset focus:ring-[--hl-md] aria-pressed:bg-[--hl-sm] aria-selected:bg-[--hl-sm]"
            onClick={() => {
              setFile('');
            }}
          >
            Select file
          </Button>
        </FileTrigger>
        {file && (
          <Button
            className="rounded-sm border border-solid border-[--hl-sm] px-4 py-2 text-base text-[--color-font] ring-1 ring-transparent transition-all hover:bg-[--hl-xs] focus:ring-inset focus:ring-[--hl-md] aria-pressed:bg-[--hl-sm] aria-selected:bg-[--hl-sm]"
            onClick={async () => {
              console.log('Generating...');
              setGenerating(true);
              const counter = setInterval(() => {
                setSecondsTaken(st => st + 1);
              }, 1000);
              try {
                const response = await window.main.llm.createMockServerFromOpenAPISpec(file, {
                  useDynamicMockResponses: false,
                });
                console.log('response', response);
              } catch (error) {
                console.error('Error creating mock server from open API spec', error);
              }
              clearInterval(counter);
              setGenerating(false);
              console.log('Generated!');
            }}
          >
            {generating ? 'Generating... please wait...' : 'Generate server contents'}
          </Button>
        )}
        {secondsTaken > 0 && <span>({secondsTaken} seconds elapsed)</span>}
      </div>
      {file && (
        <div className="flex h-full w-full flex-row gap-2">
          <CodeEditor id="madafackah" readOnly defaultValue={file} mode="yaml" />
        </div>
      )}
    </div>
  );
};

export default Sandbox;
