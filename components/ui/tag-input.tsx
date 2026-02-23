import React, { useState, KeyboardEvent, ClipboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TagInputProps {
    placeholder?: string;
    tags: string[];
    setTags: (tags: string[]) => void;
    validate?: (tag: string) => boolean;
    disabled?: boolean;
    className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
    placeholder,
    tags,
    setTags,
    validate,
    disabled = false,
    className
}) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        setError(null);
    };

    const addTag = (tagToAdd: string) => {
        const trimmedTag = tagToAdd.trim();
        if (!trimmedTag) return;

        if (tags.includes(trimmedTag)) {
            setError('Tag already exists');
            return;
        }

        if (validate && !validate(trimmedTag)) {
            setError('Invalid format');
            return;
        }

        setTags([...tags, trimmedTag]);
        setInputValue('');
        setError(null);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            const newTags = [...tags];
            newTags.pop();
            setTags(newTags);
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const pastedTags = pastedData.split(/[\n,]+/).map(tag => tag.trim()).filter(Boolean);

        const newTags = [...tags];
        let hasError = false;

        pastedTags.forEach(tag => {
            if (!newTags.includes(tag) && (!validate || validate(tag))) {
                newTags.push(tag);
            } else {
                hasError = true;
            }
        });

        setTags(newTags);
        if (hasError) {
            setError('Some tags were invalid or duplicates and were ignored');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div className={cn(
                "flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] bg-background",
                disabled && "opacity-50 cursor-not-allowed",
                "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            )}>
                {tags.map((tag, index) => (
                    <Badge key={index} color="secondary" rounded="full" className="gap-1">
                        {tag}
                        {!disabled && (
                            <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => removeTag(tag)}
                            />
                        )}
                    </Badge>
                ))}
                <Input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={tags.length === 0 ? placeholder : ''}
                    disabled={disabled}
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-6 min-w-[120px]"
                />
            </div>
            {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
    );
};
