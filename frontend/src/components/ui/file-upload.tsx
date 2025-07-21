/**
 * Copyright 2025 Copyright AGNTCY Contributors (https://github.com/agntcy)
 * SPDX-License-Identifier: Apache-2.0
 */

import {Input, InputProps} from '@/components/ui/input';
import {SVGProps, useEffect} from 'react';
import {JSX} from 'react/jsx-runtime';
import {Typography} from '@mui/material';
import {useState} from 'react';
import {GeneralSize, Tag, toast} from '@outshift/spark-design';
import {cn} from '@/lib/utils';

interface FileUploadProps extends InputProps {
  onConvert?: (binary?: ArrayBuffer) => void;
  handleChange?: (file: File) => void;
  defaultFile?: File | string;
}

export const FileUpload = ({onConvert, handleChange, defaultFile, disabled, ...props}: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      handleChange?.(event.target.files[0]);
      props.onChange?.(event as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const droppedFile = event.dataTransfer.files[0];
      setFile(droppedFile);
      handleChange?.(droppedFile);

      // Create a synthetic change event for props.onChange
      const input = document.getElementById('file') as HTMLInputElement;
      if (input && props.onChange) {
        // Create a new FileList with the dropped file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        input.files = dataTransfer.files;

        // Create synthetic event
        const syntheticEvent = {
          target: input,
          currentTarget: input
        } as React.ChangeEvent<HTMLInputElement>;

        props.onChange(syntheticEvent);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const hasFile = file !== null;

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = () => {
        onConvert?.(reader.result as ArrayBuffer);
      };
      reader.onerror = () => {
        setFile(null);
        toast({
          title: 'Error reading file',
          description: 'There was an error reading the file. Please try again.',
          type: 'error'
        });
      };
    } else {
      onConvert?.(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  useEffect(() => {
    if (defaultFile) {
      if (typeof defaultFile === 'string') {
        setFile(new File([defaultFile], 'default.json', {type: 'application/json'}));
      } else {
        setFile(defaultFile);
      }
    }
  }, [defaultFile]);

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-[4px] flex flex-col gap-2 p-6 items-center w-full',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        'h-[148px]',
        isDragging ? 'bg-[#E0E7FF]' : 'bg-[#FBFCFE]'
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      {!hasFile ? (
        <div className="flex flex-col items-center gap-2">
          <UploadIcon className="w-[40px] h-[40px] text-[#C5C7CB]" />
          <div className="flex items-center gap-1">
            <label htmlFor="file" className="cursor-pointer">
              <Typography color="#187ADC" sx={{textDecoration: 'underline'}} variant="subtitle2">
                Click
              </Typography>
            </label>
            <Typography variant="body2" color="#1A1F27">
              or drag & drop
            </Typography>
          </div>
          <Typography variant="caption" color="#59616B">
            JSON (max. 3MB)
          </Typography>
          <Input
            {...props}
            disabled={disabled}
            id="file"
            type="file"
            placeholder="File"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              handleFileChange(e);
            }}
          />
        </div>
      ) : (
        <div className="my-auto">
          <Tag
            onDelete={(event) => {
              setFile(null);
              props.onChange?.(event as unknown as React.ChangeEvent<HTMLInputElement>);
            }}
            size={GeneralSize.Small}
          >
            <Typography variant="caption" color="#59616B">
              {file.name}
            </Typography>
          </Tag>
        </div>
      )}
    </div>
  );
};

function UploadIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M9.99984 33.3334C9.08317 33.3334 8.29845 32.9981 7.64567 32.3275C6.99289 31.6569 6.6665 30.8507 6.6665 29.9091V26.4848C6.6665 25.9997 6.82623 25.593 7.14567 25.2649C7.46512 24.9367 7.86095 24.7726 8.33317 24.7726C8.80539 24.7726 9.20123 24.9367 9.52067 25.2649C9.84011 25.593 9.99984 25.9997 9.99984 26.4848V29.9091H29.9998V26.4848C29.9998 25.9997 30.1596 25.593 30.479 25.2649C30.7984 24.9367 31.1943 24.7726 31.6665 24.7726C32.1387 24.7726 32.5346 24.9367 32.854 25.2649C33.1734 25.593 33.3332 25.9997 33.3332 26.4848V29.9091C33.3332 30.8507 33.0068 31.6569 32.354 32.3275C31.7012 32.9981 30.9165 33.3334 29.9998 33.3334H9.99984ZM18.3332 12.5308L15.2082 15.7411C14.8748 16.0835 14.479 16.2476 14.0207 16.2333C13.5623 16.219 13.1665 16.0407 12.8332 15.6983C12.5276 15.3558 12.3679 14.9563 12.354 14.4998C12.3401 14.0432 12.4998 13.6437 12.8332 13.3013L18.8332 7.13753C18.9998 6.96631 19.1804 6.84504 19.3748 6.7737C19.5693 6.70236 19.7776 6.66669 19.9998 6.66669C20.2221 6.66669 20.4304 6.70236 20.6248 6.7737C20.8193 6.84504 20.9998 6.96631 21.1665 7.13753L27.1665 13.3013C27.4998 13.6437 27.6596 14.0432 27.6457 14.4998C27.6318 14.9563 27.4721 15.3558 27.1665 15.6983C26.8332 16.0407 26.4373 16.219 25.979 16.2333C25.5207 16.2476 25.1248 16.0835 24.7915 15.7411L21.6665 12.5308V24.7726C21.6665 25.2577 21.5068 25.6644 21.1873 25.9925C20.8679 26.3207 20.4721 26.4848 19.9998 26.4848C19.5276 26.4848 19.1318 26.3207 18.8123 25.9925C18.4929 25.6644 18.3332 25.2577 18.3332 24.7726V12.5308Z" />
    </svg>
  );
}
