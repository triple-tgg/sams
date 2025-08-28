import { useToast } from "@/components/ui/use-toast";

export const useTemplateDownload = () => {
    const { toast } = useToast();

    // ฟังก์ชันดาวน์โหลดไฟล์ template
    const handleDownloadTemplate = (templatePath: string = '/flie/SAMS-Import_Template.xlsx', fileName: string = 'SAMS-Import_Template.xlsx') => {
        try {
            // สร้าง link element สำหรับดาวน์โหลด
            const link = document.createElement('a');
            link.href = templatePath; // path ไปยังไฟล์ใน public folder
            link.download = fileName; // ชื่อไฟล์ที่จะดาวน์โหลด
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // แสดง toast notification ว่าดาวน์โหลดสำเร็จ
            toast({
                title: "Template Downloaded",
                description: `${fileName} has been downloaded successfully.`,
            });
        } catch (error) {
            console.error('Error downloading template:', error);
            // แสดง toast notification ว่าดาวน์โหลดไม่สำเร็จ
            toast({
                variant: "destructive",
                title: "Download Failed",
                description: "Failed to download template. Please try again.",
            });
        }
    };

    return {
        handleDownloadTemplate
    };
};
