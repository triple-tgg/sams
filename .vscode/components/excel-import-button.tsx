import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";
import { useExcelImport } from "@/hooks/use-excel-import";

interface ExcelImportButtonProps {
    onImportSuccess?: () => void;
    disabled?: boolean;
    className?: string;
    variant?: "default" | "outline" | "ghost" | "soft" | "shadow";
    color?: "default" | "primary" | "secondary" | "success" | "info" | "warning" | "destructive";
    size?: "default" | "sm" | "lg" | "icon";
}

export const ExcelImportButton = ({
    onImportSuccess,
    disabled = false,
    className,
    variant = "outline",
    color = "primary",
    size = "default"
}: ExcelImportButtonProps) => {
    const { isUploading, fileInputRef, handleImportFile, handleFileChange } = useExcelImport();

    const handleFileChangeWithCallback = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            await handleFileChange(event);
            // เรียก callback เมื่อ import สำเร็จ
            onImportSuccess?.();
        } catch (error) {
            // Error ถูกจัดการใน hook แล้ว
            console.error('Import failed:', error);
        }
    };

    return (
        <>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChangeWithCallback}
                style={{ display: 'none' }}
            />
            
            <Button
                color={color}
                variant={variant}
                size={size}
                onClick={handleImportFile}
                disabled={isUploading || disabled}
                className={className}
            >
                <FileUp className="w-3.5 h-3.5 me-1" />
                <span>{isUploading ? 'Importing...' : 'Import'}</span>
            </Button>
        </>
    );
};
