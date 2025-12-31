import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

const SetPermissionPage = () => {
    const t = useTranslations("Menu");
    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>{t("set-permission")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Set Permission management page content will be displayed here.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default SetPermissionPage;
